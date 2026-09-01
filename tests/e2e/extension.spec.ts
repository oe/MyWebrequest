/// <reference types="chrome" />

import http from 'node:http';
import { readFile } from 'node:fs/promises';

import type { BrowserContext, Page } from '@playwright/test';
import type { StoredMigration } from '@/application/migration-apply';
import type { Rule, StoredState } from '@/domain/rules/model';

import { expect, test } from './extension.fixture';
import legacyFixture from '../fixtures/legacy-installation.json' with { type: 'json' };

const now = '2026-09-01T00:00:00.000Z';

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
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
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
  const errors: string[] = [];
  options.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  options.on('pageerror', (error) => errors.push(error.message));
  await options.goto(`chrome-extension://${extensionId}/options.html`);

  await expect(options).toHaveTitle('My Webrequest');
  await expect(options.getByText('My Webrequest', { exact: true })).toBeVisible();
  const primaryNavigation = options.getByRole('navigation', { name: 'Primary navigation' });
  await expect(primaryNavigation.getByRole('button', { name: 'Rules' })).toBeVisible();
  await expect(primaryNavigation.getByText('Legacy migration')).toHaveCount(0);

  await options.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(options.getByRole('menuitem', { name: 'Legacy migration' })).toBeVisible();
  expect(errors).toEqual([]);
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
      return {
        status: (stored.requestRulesMigration as StoredMigration).status,
        ruleCount: Object.keys((stored.requestRulesState as StoredState).rules).length,
      };
    })
    .toEqual({ status: 'rolled-back', ruleCount: 0 });
  await expect(options.getByText('Rolled back', { exact: true }).first()).toBeVisible();
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
    server.closeAllConnections();
    await close(server);
  }
});
