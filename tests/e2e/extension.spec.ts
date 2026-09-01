/// <reference types="chrome" />

import http from 'node:http';
import https from 'node:https';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Duplex } from 'node:stream';
import { promisify } from 'node:util';

import type { BrowserContext, Page, Worker } from '@playwright/test';
import type { StoredMigration } from '@/application/migration-apply';
import { parseRuleBackup } from '@/application/rule-backup';
import type { Rule, StoredState } from '@/domain/rules/model';
import type { RuleImportRecovery } from '@/infrastructure/rule-import-recovery';
import { createTranslator, supportedLocales, type AppLocale } from '@/ui/i18n/core';

import { expect, findExtensionWorker, launchChromiumExtensionContext, test } from './extension.fixture';
import legacyFixture from '../fixtures/legacy-installation.json' with { type: 'json' };

const now = '2026-09-01T00:00:00.000Z';
const execFileAsync = promisify(execFile);
const browserTarget = process.env.MWR_BROWSER_TARGET === 'edge' ? 'edge' : 'chrome';
const productionExtensionPath = resolve(
  process.env.MWR_EXTENSION_PATH ?? join(process.cwd(), `dist/${browserTarget}-mv3`),
);

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

function permissionRules(): Rule[] {
  return [
    {
      schemaVersion: 1,
      id: 'e2e-navigation-redirect',
      dnrId: 1_900_003,
      name: 'Navigation redirect permission',
      enabled: false,
      priority: 10,
      condition: {
        url: { kind: 'wildcard', value: 'https://matched.example/*' },
        resourceTypes: ['main_frame'],
        initiatorDomains: ['ignored.example'],
      },
      action: { kind: 'redirect', target: 'https://destination.example/' },
      permissionOrigins: ['https://matched.example/*'],
      migrationState: 'none',
      createdAt: now,
      updatedAt: now,
    },
    {
      schemaVersion: 1,
      id: 'e2e-subresource-header',
      dnrId: 1_900_004,
      name: 'Subresource header permission',
      enabled: false,
      priority: 10,
      condition: {
        url: { kind: 'wildcard', value: 'https://api.example/*' },
        resourceTypes: ['xmlhttprequest'],
        initiatorDomains: ['app.example'],
      },
      action: {
        kind: 'modify-request-headers',
        operations: [{ header: 'X-E2E-Test', operation: 'set', value: 'permission-scope' }],
      },
      permissionOrigins: ['https://api.example/*'],
      migrationState: 'none',
      createdAt: now,
      updatedAt: now,
    },
  ];
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

async function extensionWithFixtureHostAccess(): Promise<{
  directory: string;
  extensionPath: string;
}> {
  const directory = await mkdtemp(join(tmpdir(), 'my-webrequest-e2e-extension-'));
  const extensionPath = join(directory, 'extension');
  await cp(productionExtensionPath, extensionPath, { recursive: true });

  const manifestPath = join(extensionPath, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
    host_permissions?: string[];
  };
  manifest.host_permissions = ['http://127.0.0.1/*', 'http://*.localhost/*', 'https://*.localhost/*'];
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return { directory, extensionPath };
}

async function legacyUpgradeFixture(): Promise<{ directory: string; extensionPath: string }> {
  const directory = await mkdtemp(join(tmpdir(), 'my-webrequest-upgrade-e2e-'));
  const extensionPath = join(directory, 'extension');
  await mkdir(extensionPath);
  await Promise.all([
    writeFile(
      join(extensionPath, 'manifest.json'),
      `${JSON.stringify(
        {
          manifest_version: 3,
          name: 'My Webrequest legacy upgrade fixture',
          version: '0.8.0',
          permissions: ['activeTab', 'storage', 'declarativeNetRequest'],
          optional_host_permissions: ['http://*/*', 'https://*/*'],
          background: { service_worker: 'legacy-background.js' },
          options_page: 'legacy-options.html',
        },
        null,
        2,
      )}\n`,
    ),
    writeFile(
      join(extensionPath, 'legacy-background.js'),
      'chrome.runtime.onInstalled.addListener(() => {});\n',
    ),
    writeFile(
      join(extensionPath, 'legacy-options.html'),
      '<!doctype html><html><body><h1>Legacy fixture</h1></body></html>\n',
    ),
  ]);
  return { directory, extensionPath };
}

async function overlayProductionExtension(extensionPath: string): Promise<void> {
  const entries = await readdir(productionExtensionPath, { withFileTypes: true });
  await Promise.all(
    entries.map((entry) =>
      cp(join(productionExtensionPath, entry.name), join(extensionPath, entry.name), {
        recursive: entry.isDirectory(),
        force: true,
      }),
    ),
  );
}

function crossOriginRules(port: number): Rule[] {
  return [
    {
      schemaVersion: 1,
      id: 'e2e-cross-origin-redirect',
      dnrId: 1_900_005,
      name: 'Cross-origin regex redirect',
      enabled: true,
      priority: 20,
      condition: {
        url: { kind: 'wildcard', value: `http://127.0.0.1:${port}/redirect/*` },
        resourceTypes: ['xmlhttprequest'],
        initiatorDomains: ['localhost'],
      },
      action: { kind: 'redirect', target: `http://localhost:${port}/target/$1` },
      permissionOrigins: ['http://127.0.0.1/*'],
      migrationState: 'none',
      createdAt: now,
      updatedAt: now,
    },
    {
      schemaVersion: 1,
      id: 'e2e-cross-origin-header',
      dnrId: 1_900_006,
      name: 'Cross-origin request header',
      enabled: true,
      priority: 10,
      condition: {
        url: { kind: 'wildcard', value: `http://127.0.0.1:${port}/headers*` },
        resourceTypes: ['xmlhttprequest'],
        initiatorDomains: ['localhost'],
      },
      action: {
        kind: 'modify-request-headers',
        operations: [{ header: 'X-E2E-Test', operation: 'set', value: 'cross-origin-pass' }],
      },
      permissionOrigins: ['http://127.0.0.1/*'],
      migrationState: 'none',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function quotaRules(count: number, kind: 'regex' | 'url-filter'): Rule[] {
  return Array.from({ length: count }, (_, index): Rule => ({
    schemaVersion: 1,
    id: `e2e-${kind}-quota-${index}`,
    dnrId: (kind === 'regex' ? 1_910_000 : 1_920_000) + index,
    name: `${kind} quota ${index}`,
    enabled: true,
    priority: 10,
    condition: {
      url:
        kind === 'regex'
          ? { kind: 'regex', value: `^https://regex-${index}\\.example/.*$` }
          : { kind: 'url-filter', value: `||filter-${index}.example^` },
      resourceTypes: ['main_frame'],
    },
    action: { kind: 'block' },
    permissionOrigins: [],
    migrationState: 'none',
    createdAt: now,
    updatedAt: now,
  }));
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
  const migrationMenuItem = options.getByRole('menuitem', { name: 'Legacy migration' });
  if (browserTarget === 'chrome') await expect(migrationMenuItem).toBeVisible();
  else await expect(migrationMenuItem).toHaveCount(0);
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

test('forced colors, reduced motion, and keyboard focus remain usable', async ({ context, extensionId }) => {
  const options = await context.newPage();
  await options.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await options.goto(`chrome-extension://${extensionId}/options.html`);

  const settings = options.getByRole('button', { name: 'Settings', exact: true });
  await settings.press('Enter');
  await expect(options.getByRole('menuitem', { name: 'Backup & restore' })).toBeVisible();
  await options.keyboard.press('Escape');
  await expect(settings).toBeFocused();

  const mediaStyles = await options.evaluate(() => {
    const header = document.querySelector<HTMLElement>('[data-material="glass-bar"]');
    const settingsButton = document.querySelector<HTMLElement>('button[aria-label="Settings"]');
    if (!header || !settingsButton) throw new Error('Accessibility fixtures are missing.');
    const headerStyle = getComputedStyle(header);
    const buttonStyle = getComputedStyle(settingsButton);
    return {
      backdropFilter: headerStyle.backdropFilter,
      boxShadow: headerStyle.boxShadow,
      transitionDuration: buttonStyle.transitionDuration,
    };
  });
  expect(mediaStyles.backdropFilter).toBe('none');
  expect(mediaStyles.boxShadow).toBe('none');
  expect(
    Math.max(...mediaStyles.transitionDuration.split(',').map((duration) => Number.parseFloat(duration))),
  ).toBeLessThanOrEqual(0.001);
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

test('permission previews stay bounded and cancel without changing runtime state', async ({
  context,
  extensionId,
  extensionWorker,
}) => {
  const [navigationRule, subresourceRule] = permissionRules();
  if (!navigationRule || !subresourceRule) throw new Error('Permission fixtures are incomplete.');
  await extensionWorker.evaluate(
    async (nextState) => chrome.storage.local.set({ requestRulesState: nextState }),
    stateWith([navigationRule, subresourceRule]),
  );

  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);

  await options.getByRole('switch', { name: `Enable ${navigationRule.name}` }).click();
  let permissionDialog = options.getByRole('dialog');
  await expect(
    permissionDialog.getByRole('heading', {
      name: `Allow “${navigationRule.name}” to access this site?`,
    }),
  ).toBeVisible();
  await expect(permissionDialog.getByText('https://matched.example/*', { exact: true })).toBeVisible();
  await expect(permissionDialog.getByText(/ignored\.example/)).toHaveCount(0);
  await permissionDialog.getByRole('button', { name: 'Cancel', exact: true }).click();

  await options.getByRole('switch', { name: `Enable ${subresourceRule.name}` }).click();
  permissionDialog = options.getByRole('dialog');
  await expect(
    permissionDialog.getByRole('heading', {
      name: `Allow “${subresourceRule.name}” to access this site?`,
    }),
  ).toBeVisible();
  const requestedOrigins = permissionDialog.getByRole('list', { name: 'Requested website access' });
  await expect(requestedOrigins.getByRole('listitem')).toHaveCount(3);
  await expect(requestedOrigins.getByText('http://*.app.example/*', { exact: true })).toBeVisible();
  await expect(requestedOrigins.getByText('https://*.app.example/*', { exact: true })).toBeVisible();
  await expect(requestedOrigins.getByText('https://api.example/*', { exact: true })).toBeVisible();
  await permissionDialog.getByRole('button', { name: 'Cancel', exact: true }).click();

  const runtime = await extensionWorker.evaluate(async () => {
    const stored = await chrome.storage.local.get('requestRulesState');
    return {
      enabled: Object.values((stored.requestRulesState as StoredState).rules).map((rule) => rule.enabled),
      origins: (await chrome.permissions.getAll()).origins ?? [],
      dynamicRules: await chrome.declarativeNetRequest.getDynamicRules(),
    };
  });
  expect(runtime).toEqual({ enabled: [false, false], origins: [], dynamicRules: [] });
});

test('fixture-granted origins prove cross-origin redirect substitution and request headers', async () => {
  let unmatchedRedirectHits = 0;
  let redirectedPath = '';
  let receivedHeader = '';
  const server = http.createServer((request, response) => {
    response.setHeader('access-control-allow-origin', '*');
    response.setHeader('content-type', 'text/plain');

    if (request.url?.startsWith('/redirect/')) {
      unmatchedRedirectHits += 1;
      response.end('redirect-rule-missed');
      return;
    }
    if (request.url?.startsWith('/target/')) {
      redirectedPath = request.url;
      response.end(`redirected:${request.url}`);
      return;
    }
    if (request.url?.startsWith('/headers')) {
      receivedHeader = String(request.headers['x-e2e-test'] ?? '');
      response.end(`header:${receivedHeader}`);
      return;
    }

    response.end('initiator-ready');
  });
  const port = await listen(server);
  const fixtureExtension = await extensionWithFixtureHostAccess();
  let context: BrowserContext | undefined;
  let closeContext: (() => Promise<void>) | undefined;

  try {
    const launched = await launchChromiumExtensionContext(fixtureExtension.extensionPath);
    context = launched.context;
    closeContext = launched.close;
    const worker = await findExtensionWorker(context);

    const rules = crossOriginRules(port);
    await worker.evaluate(
      async (nextState) => chrome.storage.local.set({ requestRulesState: nextState }),
      stateWith(rules),
    );
    await expect
      .poll(() =>
        worker.evaluate(async () =>
          (await chrome.declarativeNetRequest.getDynamicRules())
            .map((rule) => rule.id)
            .sort((left, right) => left - right),
        ),
      )
      .toEqual(rules.map((rule) => rule.dnrId).sort((left, right) => left - right));

    expect(
      await worker.evaluate(async () => (await chrome.permissions.getAll()).origins?.sort() ?? []),
    ).toEqual(['http://*.localhost/*', 'http://127.0.0.1/*', 'https://*.localhost/*']);

    const initiator = await context.newPage();
    await initiator.goto(`http://localhost:${port}/app`);
    const result = await initiator.evaluate(async (fixturePort) => {
      const redirect = await fetch(`http://127.0.0.1:${fixturePort}/redirect/captured-value`);
      const header = await fetch(`http://127.0.0.1:${fixturePort}/headers?probe=1`);
      return {
        redirect: await redirect.text(),
        redirectUrl: redirect.url,
        header: await header.text(),
      };
    }, port);

    expect(result).toEqual({
      redirect: 'redirected:/target/captured-value',
      redirectUrl: `http://localhost:${port}/target/captured-value`,
      header: 'header:cross-origin-pass',
    });
    expect(unmatchedRedirectHits).toBe(0);
    expect(redirectedPath).toBe('/target/captured-value');
    expect(receivedHeader).toBe('cross-origin-pass');
  } finally {
    await closeContext?.();
    await close(server);
    await rm(fixtureExtension.directory, { force: true, recursive: true });
  }
});

test('isolated profile enforces the regex and total dynamic-rule safety boundaries', async ({
  extensionWorker,
}) => {
  test.setTimeout(90_000);

  const regexRules = quotaRules(902, 'regex');
  await extensionWorker.evaluate(
    async (nextState) => chrome.storage.local.set({ requestRulesState: nextState }),
    stateWith(regexRules),
  );
  await expect
    .poll(
      () =>
        extensionWorker.evaluate(async () =>
          (await chrome.declarativeNetRequest.getDynamicRules())
            .map((rule) => rule.id)
            .sort((left, right) => left - right),
        ),
      { timeout: 30_000 },
    )
    .toEqual(regexRules.slice(0, 900).map((rule) => rule.dnrId));

  const dynamicRules = quotaRules(4_502, 'url-filter');
  await extensionWorker.evaluate(
    async (nextState) => chrome.storage.local.set({ requestRulesState: nextState }),
    stateWith(dynamicRules),
  );
  await expect
    .poll(
      () =>
        extensionWorker.evaluate(async () => {
          const rules = await chrome.declarativeNetRequest.getDynamicRules();
          return {
            count: rules.length,
            first: rules.reduce((minimum, rule) => Math.min(minimum, rule.id), Number.MAX_SAFE_INTEGER),
            last: rules.reduce((maximum, rule) => Math.max(maximum, rule.id), 0),
          };
        }),
      { timeout: 30_000 },
    )
    .toEqual({ count: 4_500, first: dynamicRules[0]?.dnrId, last: dynamicRules[4_499]?.dnrId });
});

test('same-extension upgrade preserves legacy page storage and stages migration', async () => {
  test.skip(browserTarget !== 'chrome', 'Legacy migration is intentionally Chrome-only.');
  const fixture = await legacyUpgradeFixture();
  const userDataDir = join(fixture.directory, 'profile');
  let launched = await launchChromiumExtensionContext(fixture.extensionPath, false, userDataDir);

  try {
    let [legacyWorker] = launched.context.serviceWorkers();
    legacyWorker ??= await launched.context.waitForEvent('serviceworker');
    const extensionId = new URL(legacyWorker.url()).host;
    const legacyOptions = await launched.context.newPage();
    await legacyOptions.goto(`chrome-extension://${extensionId}/legacy-options.html`);
    await legacyOptions.evaluate((source) => {
      for (const [key, value] of Object.entries(source)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }, legacyFixture);
    expect(await legacyOptions.evaluate(() => localStorage.length)).toBe(Object.keys(legacyFixture).length);
    await launched.close();

    await overlayProductionExtension(fixture.extensionPath);
    launched = await launchChromiumExtensionContext(fixture.extensionPath, false, userDataDir);
    let [productionWorker] = launched.context.serviceWorkers();
    productionWorker ??= await launched.context.waitForEvent('serviceworker');
    expect(productionWorker.url()).toBe(`chrome-extension://${extensionId}/background.js`);

    const options = await launched.context.newPage();
    await options.goto(`chrome-extension://${extensionId}/options.html`);
    await expect(options.getByRole('button', { name: 'Legacy migration' })).toBeVisible();
    expect(
      await options.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), 'future-key'),
    ).toEqual(legacyFixture['future-key']);

    const staged = (await productionWorker.evaluate(async () => {
      const stored = await chrome.storage.local.get('requestRulesMigration');
      return stored.requestRulesMigration;
    })) as StoredMigration;
    expect(staged.status).toBe('pending');
    expect(staged.bundle.report.items).toHaveLength(20);
    expect(staged.bundle.rawSnapshot['future-key']).toContain('onerror=alert(1)');
  } finally {
    await launched.close();
    await rm(fixture.directory, { force: true, recursive: true });
  }
});

test('legacy localStorage is reviewed, exported, applied disabled, and rolled back', async ({
  context,
  extensionId,
  extensionWorker,
}) => {
  test.skip(browserTarget !== 'chrome', 'Legacy migration is intentionally Chrome-only.');
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
  await expect(
    options
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('button', { name: 'Legacy migration' }),
  ).toHaveCount(0);
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
    let restartedWorker: Worker | undefined;
    await expect
      .poll(async () => {
        for (const candidate of context.serviceWorkers()) {
          try {
            if ((await candidate.evaluate(() => chrome.runtime.id)) === extensionId) {
              restartedWorker = candidate;
              return true;
            }
          } catch {
            // A stopped worker can disappear while the browser reports the new worker.
          }
        }
        return false;
      })
      .toBe(true);
    expect(restartedWorker).toBeDefined();
    if (!restartedWorker) throw new Error('Extension service worker did not restart.');
    const verifiedRestartedWorker = restartedWorker;
    expect(new URL(verifiedRestartedWorker.url()).host).toBe(extensionId);
    await expect
      .poll(() => verifiedRestartedWorker.evaluate(() => chrome.declarativeNetRequest.getDynamicRules()))
      .toEqual([]);
    await pauseSwitch.click();
    await expect
      .poll(() =>
        verifiedRestartedWorker.evaluate(
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
