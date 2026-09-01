/// <reference types="chrome" />

import http from 'node:http';
import https from 'node:https';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Duplex } from 'node:stream';
import { promisify } from 'node:util';

import type { BrowserContext, Page } from '@playwright/test';
import type { StoredMigration } from '@/application/migration-apply';
import { parseRuleBackup } from '@/application/rule-backup';
import type { Rule, StoredState } from '@/domain/rules/model';
import type { RuleImportRecovery } from '@/infrastructure/rule-import-recovery';
import { createTranslator, supportedLocales, type AppLocale } from '@/ui/i18n/core';

import { expect, test } from './extension.fixture';
import legacyFixture from '../fixtures/legacy-installation.json' with { type: 'json' };

const now = '2026-09-01T00:00:00.000Z';
const execFileAsync = promisify(execFile);

const languageChoices: Record<AppLocale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  ko: '한국어',
  ja: '日本語',
  fr: 'Français',
  es: 'Español',
};

function stateWith(rules: Rule[], globallyPaused = false): StoredState {
  return {
    schemaVersion: 1,
    rules: Object.fromEntries(rules.map((rule) => [rule.id, rule])),
    order: rules.map((rule) => rule.id),
    settings: { globallyPaused },
  };
}

function blockRule(port: number): Rule {
  return {
    schemaVersion: 1,
    id: 'e2e-block',
    dnrId: 1_900_001,
    name: 'E2E block probe',
    enabled: true,
    priority: 10,
    condition: {
      url: { kind: 'wildcard', value: `http://127.0.0.1:${port}/blocked*` },
      resourceTypes: ['main_frame'],
    },
    action: { kind: 'block' },
    permissionOrigins: [],
    migrationState: 'none',
    createdAt: now,
    updatedAt: now,
  };
}

function upgradeRule(port: number): Rule {
  return {
    schemaVersion: 1,
    id: 'e2e-upgrade',
    dnrId: 1_900_002,
    name: 'E2E HTTPS upgrade probe',
    enabled: true,
    priority: 10,
    condition: {
      url: { kind: 'wildcard', value: `http://127.0.0.1:${port}/upgrade*` },
      resourceTypes: ['main_frame'],
    },
    action: { kind: 'upgrade-scheme' },
    permissionOrigins: [],
    migrationState: 'none',
    createdAt: now,
    updatedAt: now,
  };
}

async function localTlsCredentials(): Promise<{ cert: string; key: string }> {
  const directory = await mkdtemp(join(tmpdir(), 'my-webrequest-e2e-tls-'));
  const keyPath = join(directory, 'key.pem');
  const certPath = join(directory, 'cert.pem');
  try {
    await execFileAsync('openssl', [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-sha256',
      '-subj',
      '/CN=127.0.0.1',
      '-addext',
      'subjectAltName=IP:127.0.0.1',
      '-days',
      '1',
      '-keyout',
      keyPath,
      '-out',
      certPath,
    ]);
    const [key, cert] = await Promise.all([readFile(keyPath, 'utf8'), readFile(certPath, 'utf8')]);
    return { cert, key };
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
}

function backupRule(id: string, dnrId: number, url: string, enabled: boolean): Rule {
  return {
    schemaVersion: 1,
    id,
    dnrId,
    name: `Backup ${id}`,
    enabled,
    priority: 10,
    condition: {
      url: { kind: 'wildcard', value: url },
      resourceTypes: ['main_frame'],
    },
    action: { kind: 'block' },
    permissionOrigins: [],
    migrationState: 'none',
    createdAt: now,
    updatedAt: now,
  };
}

async function listen(server: http.Server): Promise<number> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Fixture server did not expose a TCP port.');
  return address.port;
}

async function close(server: http.Server): Promise<void> {
  const closed = new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  server.closeAllConnections();
  await closed;
}

async function stopExtensionServiceWorker(
  context: BrowserContext,
  page: Page,
  extensionId: string,
): Promise<void> {
  const session = await context.newCDPSession(page);
  const version = await new Promise<{ versionId: string }>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Chromium did not report the extension service worker version.')),
      10_000,
    );
    session.on('ServiceWorker.workerVersionUpdated', ({ versions }) => {
      const candidate = versions.find(
        (item) =>
          item.scriptURL.startsWith(`chrome-extension://${extensionId}/`) && item.runningStatus === 'running',
      );
      if (!candidate) return;
      clearTimeout(timer);
      resolve({ versionId: candidate.versionId });
    });
    void session.send('ServiceWorker.enable').catch(reject);
  });
  await session.send('ServiceWorker.stopWorker', version);
  await session.detach();
}

test('clean install exposes the product UI without required host access', async ({
  context,
  extensionId,
  extensionWorker,
}) => {
  const origins = await extensionWorker.evaluate(
    async () => (await chrome.permissions.getAll()).origins ?? [],
  );
  expect(origins).toEqual([]);

  const options = await context.newPage();
  const consoleIssues: string[] = [];
  options.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      consoleIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  options.on('pageerror', (error) => consoleIssues.push(`pageerror: ${error.message}`));
  await options.goto(`chrome-extension://${extensionId}/options.html`);

  await expect(options).toHaveTitle('My Webrequest');
  await expect(options.getByText('My Webrequest', { exact: true })).toBeVisible();
  const primaryNavigation = options.getByRole('navigation', { name: 'Primary navigation' });
  await expect(primaryNavigation.getByRole('button', { name: 'Rules' })).toBeVisible();
  await expect(primaryNavigation.getByText('Legacy migration')).toHaveCount(0);

  await options.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(options.getByRole('menuitem', { name: 'Legacy migration' })).toBeVisible();
  expect(consoleIssues).toEqual([]);
});

test('all six locales switch by keyboard, persist, and fit the compact layout', async ({
  context,
  extensionId,
}) => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);

  let currentLocale: AppLocale = 'en';
  for (const nextLocale of supportedLocales) {
    const current = createTranslator(currentLocale);
    await options.getByRole('button', { name: current('language'), exact: true }).press('Enter');
    await options
      .getByRole('menuitemradio', { name: languageChoices[nextLocale], exact: true })
      .press('Enter');

    const next = createTranslator(nextLocale);
    await expect(options.locator('html')).toHaveAttribute('lang', nextLocale);
    await expect(options.getByRole('navigation', { name: next('primaryNavigation') })).toBeVisible();
    await expect(options.getByRole('button', { name: next('settings'), exact: true })).toBeVisible();
    currentLocale = nextLocale;
  }

  await options.reload();
  const persisted = createTranslator('es');
  await expect(options.locator('html')).toHaveAttribute('lang', 'es');
  await expect(options.getByRole('button', { name: persisted('settings'), exact: true })).toBeVisible();

  await options.setViewportSize({ width: 640, height: 900 });
  await expect(options.getByRole('button', { name: persisted('language'), exact: true })).toBeVisible();
  expect(
    await options.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    })),
  ).toEqual({ clientWidth: 640, scrollWidth: 640 });
});

test.describe('hostless HTTPS upgrade', () => {
  test.use({ ignoreHTTPSErrors: true });

  test('upgrades a real local navigation without requesting host access', async ({
    context,
    extensionId,
    extensionWorker,
  }) => {
    const tls = await localTlsCredentials();
    let upgradeHits = 0;
    const sockets = new Set<Duplex>();
    const server = https.createServer(tls, (request, response) => {
      if (request.url?.startsWith('/upgrade')) upgradeHits += 1;
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.end('upgrade-ok');
    });
    server.on('connection', (socket) => {
      sockets.add(socket);
      socket.once('close', () => sockets.delete(socket));
    });
    const port = await listen(server);
    const rule = upgradeRule(port);

    try {
      await extensionWorker.evaluate(
        async (nextState) => chrome.storage.local.set({ requestRulesState: nextState }),
        stateWith([rule]),
      );
      await expect
        .poll(() =>
          extensionWorker.evaluate(
            async (dnrId) =>
              (await chrome.declarativeNetRequest.getDynamicRules()).some((item) => item.id === dnrId),
            rule.dnrId,
          ),
        )
        .toBe(true);
      expect(
        await extensionWorker.evaluate(async () => (await chrome.permissions.getAll()).origins ?? []),
      ).toEqual([]);

      const options = await context.newPage();
      await options.goto(`chrome-extension://${extensionId}/options.html`);
      await expect(options.getByText('Active', { exact: true }).first()).toBeVisible();

      const probe = await context.newPage();
      const response = await probe.goto(`http://127.0.0.1:${port}/upgrade?probe=1`);
      expect(response?.status()).toBe(200);
      expect(new URL(probe.url()).protocol).toBe('https:');
      await expect(probe.locator('body')).toHaveText('upgrade-ok');
      expect(upgradeHits).toBe(1);
      await probe.close();
      await options.close();
    } finally {
      const closing = close(server);
      for (const socket of sockets) socket.destroy();
      await closing;
    }
  });
});

test('legacy localStorage is reviewed, exported, applied disabled, and rolled back', async ({
  context,
  extensionId,
  extensionWorker,
}) => {
  const options = await context.newPage();
  let nativeDialogCount = 0;
  options.on('dialog', (dialog) => {
    nativeDialogCount += 1;
    void dialog.dismiss();
  });
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.evaluate((source) => {
    for (const [key, value] of Object.entries(source)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, legacyFixture);
  await options.reload();

  const primaryNavigation = options.getByRole('navigation', { name: 'Primary navigation' });
  const migrationButton = primaryNavigation.getByRole('button', { name: 'Legacy migration' });
  await expect(migrationButton).toBeVisible();
  await migrationButton.click();
  await expect(options.getByRole('heading', { name: 'Legacy migration' })).toBeVisible();
  await expect(options.getByText('Pending', { exact: true }).first()).toBeVisible();

  const pendingMigration = (await extensionWorker.evaluate(async () => {
    const stored = await chrome.storage.local.get('requestRulesMigration');
    return stored.requestRulesMigration;
  })) as StoredMigration;
  expect(pendingMigration.bundle.report.items).toHaveLength(20);
  expect(new Set(pendingMigration.bundle.report.items.map((item) => item.id)).size).toBe(20);
  expect(pendingMigration.selectedItemIds).toHaveLength(2);
  expect(pendingMigration.bundle.rawSnapshot['future-key']).toContain('onerror=alert(1)');

  const downloadPromise = options.waitForEvent('download');
  await options.getByRole('button', { name: 'Export report' }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error('Migration report download did not produce a local file.');
  const exported = JSON.parse(await readFile(downloadPath, 'utf8')) as {
    exportVersion: number;
    kind: string;
    report: StoredMigration['bundle']['report'];
    rawSnapshot: Record<string, string>;
  };
  expect(exported).toMatchObject({
    exportVersion: 1,
    kind: 'my-webrequest-legacy-migration',
    report: { items: expect.any(Array) },
  });
  expect(exported.report.items).toHaveLength(20);
  expect(exported.rawSnapshot['future-key']).toContain('onerror=alert(1)');
  expect(nativeDialogCount).toBe(0);

  await options.getByRole('button', { name: 'Apply 2 selected' }).click();
  await expect
    .poll(async () => {
      const stored = await extensionWorker.evaluate(async () =>
        chrome.storage.local.get(['requestRulesMigration', 'requestRulesState']),
      );
      if (!stored.requestRulesMigration || !stored.requestRulesState) {
        return { status: 'waiting', rules: [] };
      }
      return {
        status: (stored.requestRulesMigration as StoredMigration).status,
        rules: Object.values((stored.requestRulesState as StoredState).rules),
      };
    })
    .toMatchObject({
      status: 'applied',
      rules: [
        expect.objectContaining({ enabled: false, migrationState: 'none' }),
        expect.objectContaining({ enabled: false, migrationState: 'none' }),
      ],
    });
  await expect(options.getByText('Applied', { exact: true }).first()).toBeVisible();
  await expect
    .poll(() => extensionWorker.evaluate(() => chrome.declarativeNetRequest.getDynamicRules()))
    .toEqual([]);

  await options.getByRole('button', { name: 'Restore pre-migration snapshot' }).click();
  const restoreDialog = options.getByRole('dialog');
  await expect(
    restoreDialog.getByRole('heading', { name: 'Restore the complete pre-migration snapshot?' }),
  ).toBeVisible();
  await restoreDialog.getByRole('button', { name: 'Restore snapshot', exact: true }).click();
  await expect
    .poll(async () => {
      const stored = await extensionWorker.evaluate(async () =>
        chrome.storage.local.get(['requestRulesMigration', 'requestRulesState']),
      );
      if (!stored.requestRulesMigration || !stored.requestRulesState) {
        return { status: 'waiting', ruleCount: -1 };
      }
      return {
        status: (stored.requestRulesMigration as StoredMigration).status,
        ruleCount: Object.keys((stored.requestRulesState as StoredState).rules).length,
      };
    })
    .toEqual({ status: 'rolled-back', ruleCount: 0 });
  await expect(options.getByText('Rolled back', { exact: true }).first()).toBeVisible();
});

test('backup export supports safe merge, replacement, and recovery', async ({
  context,
  extensionId,
  extensionWorker,
}) => {
  const sourceRule = backupRule('source-a', 1_910_001, 'https://source.example/*', true);
  const currentRule = backupRule('current-b', 1_910_002, 'https://current.example/*', false);

  await extensionWorker.evaluate(
    async (sourceState) => chrome.storage.local.set({ requestRulesState: sourceState }),
    stateWith([sourceRule]),
  );

  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.getByRole('button', { name: 'Settings', exact: true }).click();
  await options.getByRole('menuitem', { name: 'Backup & restore' }).click();
  await expect(options.getByRole('heading', { name: 'Backup & restore' })).toBeVisible();

  const downloadPromise = options.waitForEvent('download');
  await options.getByRole('button', { name: 'Export backup' }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  if (!backupPath) throw new Error('Rule backup download did not produce a local file.');
  const parsed = await parseRuleBackup(await readFile(backupPath, 'utf8'));
  expect(parsed.integrity).toBe('verified');
  expect(parsed.backup.state.order).toEqual([sourceRule.id]);
  expect(parsed.backup.state.rules[sourceRule.id]).toMatchObject({
    id: sourceRule.id,
    enabled: true,
  });

  await extensionWorker.evaluate(
    async (currentState) => chrome.storage.local.set({ requestRulesState: currentState }),
    stateWith([currentRule]),
  );
  await options.getByRole('button', { name: 'Rules', exact: true }).click();
  await expect(options.getByRole('heading', { name: currentRule.name, exact: true })).toBeVisible();
  await options.getByRole('button', { name: 'Settings', exact: true }).click();
  await options.getByRole('menuitem', { name: 'Backup & restore' }).click();

  const backupInput = options.getByLabel('Choose rule backup JSON file');
  await backupInput.setInputFiles(backupPath);
  await expect(options.getByRole('heading', { name: 'Import preview' })).toBeVisible();
  await expect(options.getByText('Checksum verified', { exact: true })).toBeVisible();
  await expect(options.getByRole('button', { name: /Merge as safe copies/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await options.getByRole('button', { name: 'Apply import' }).click();

  await expect
    .poll(async () => {
      const stored = await extensionWorker.evaluate(async () =>
        chrome.storage.local.get(['requestRulesState', 'ruleImportRecovery']),
      );
      const state = stored.requestRulesState as StoredState;
      return {
        order: [...state.order].sort(),
        importedEnabled: state.rules[sourceRule.id]?.enabled,
        recovery: stored.ruleImportRecovery,
      };
    })
    .toEqual({
      order: [currentRule.id, sourceRule.id].sort(),
      importedEnabled: false,
      recovery: undefined,
    });

  await backupInput.setInputFiles(backupPath);
  await options.getByRole('button', { name: /Replace all rules/ }).click();
  await expect(options.getByText('Current rules will be replaced', { exact: true })).toBeVisible();
  await options.getByRole('button', { name: 'Apply import' }).click();

  await expect
    .poll(async () => {
      const stored = await extensionWorker.evaluate(async () =>
        chrome.storage.local.get(['requestRulesState', 'ruleImportRecovery']),
      );
      const state = stored.requestRulesState as StoredState;
      const recovery = stored.ruleImportRecovery as RuleImportRecovery | undefined;
      return {
        order: state.order,
        importedEnabled: state.rules[sourceRule.id]?.enabled,
        recoveryOrder: recovery ? [...recovery.state.order].sort() : null,
      };
    })
    .toEqual({
      order: [sourceRule.id],
      importedEnabled: false,
      recoveryOrder: [currentRule.id, sourceRule.id].sort(),
    });

  await expect(options.getByText('Pre-replace snapshot available', { exact: true })).toBeVisible();
  await options.getByRole('button', { name: 'Restore previous rules' }).click();
  const restoreDialog = options.getByRole('dialog');
  await expect(
    restoreDialog.getByRole('heading', { name: 'Restore the rules from before the last replacement?' }),
  ).toBeVisible();
  await restoreDialog.getByRole('button', { name: 'Restore previous rules', exact: true }).click();

  await expect
    .poll(async () => {
      const stored = await extensionWorker.evaluate(async () =>
        chrome.storage.local.get(['requestRulesState', 'ruleImportRecovery']),
      );
      const state = stored.requestRulesState as StoredState;
      return {
        order: [...state.order].sort(),
        recovery: stored.ruleImportRecovery,
      };
    })
    .toEqual({
      order: [currentRule.id, sourceRule.id].sort(),
      recovery: undefined,
    });
});

test('block rules reconcile across popup pause and service-worker restart', async ({
  context,
  extensionId,
  extensionWorker,
}) => {
  let blockedPathHits = 0;
  const server = http.createServer((request, response) => {
    if (request.url?.startsWith('/blocked')) blockedPathHits += 1;
    response.writeHead(200, { 'content-type': 'text/plain' });
    response.end('fixture-ok');
  });
  const port = await listen(server);
  const rule = blockRule(port);

  try {
    await extensionWorker.evaluate(
      async (nextState) => {
        await chrome.storage.local.set({ requestRulesState: nextState });
      },
      stateWith([rule]),
    );
    await expect
      .poll(() =>
        extensionWorker.evaluate(
          async (dnrId) =>
            (await chrome.declarativeNetRequest.getDynamicRules()).some((item) => item.id === dnrId),
          rule.dnrId,
        ),
      )
      .toBe(true);

    const options = await context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html`);
    await expect(options.getByText('Active', { exact: true }).first()).toBeVisible();

    const probe = await context.newPage();
    await expect(probe.goto(`http://127.0.0.1:${port}/blocked?initial`)).rejects.toThrow(
      /ERR_BLOCKED_BY_CLIENT/,
    );
    expect(blockedPathHits).toBe(0);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    const pauseSwitch = popup.getByRole('switch', { name: 'Pause all rules' });
    await pauseSwitch.click();
    await expect
      .poll(() => extensionWorker.evaluate(() => chrome.declarativeNetRequest.getDynamicRules()))
      .toEqual([]);
    await expect(options.getByText('Paused', { exact: true }).first()).toBeVisible();

    await probe.goto(`http://127.0.0.1:${port}/blocked?paused`);
    await expect(probe.locator('body')).toHaveText('fixture-ok');
    expect(blockedPathHits).toBe(1);

    await pauseSwitch.click();
    await expect
      .poll(() =>
        extensionWorker.evaluate(
          async (dnrId) =>
            (await chrome.declarativeNetRequest.getDynamicRules()).some((item) => item.id === dnrId),
          rule.dnrId,
        ),
      )
      .toBe(true);

    await stopExtensionServiceWorker(context, options, extensionId);
    await pauseSwitch.click();
    await expect
      .poll(async () => {
        const [candidate] = context.serviceWorkers();
        if (!candidate) return false;
        try {
          return (await candidate.evaluate(() => chrome.runtime.id)) === extensionId;
        } catch {
          return false;
        }
      })
      .toBe(true);
    const [restartedWorker] = context.serviceWorkers();
    expect(restartedWorker).toBeDefined();
    if (!restartedWorker) throw new Error('Extension service worker did not restart.');
    expect(new URL(restartedWorker.url()).host).toBe(extensionId);
    await expect
      .poll(() => restartedWorker.evaluate(() => chrome.declarativeNetRequest.getDynamicRules()))
      .toEqual([]);
    await pauseSwitch.click();
    await expect
      .poll(() =>
        restartedWorker.evaluate(
          async (dnrId) =>
            (await chrome.declarativeNetRequest.getDynamicRules()).some((item) => item.id === dnrId),
          rule.dnrId,
        ),
      )
      .toBe(true);
    await expect(probe.goto(`http://127.0.0.1:${port}/blocked?reloaded`)).rejects.toThrow(
      /ERR_BLOCKED_BY_CLIENT/,
    );
    expect(blockedPathHits).toBe(1);
  } finally {
    await close(server);
  }
});
