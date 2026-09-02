import { createHash } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { chromium } from '@playwright/test';
import { hashArchiveContents } from './hash-archive-contents.mjs';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const requestedTargets = process.argv.slice(2).filter((argument) => argument !== '--');
const targets = requestedTargets.length > 0 ? requestedTargets : ['chrome', 'edge', 'firefox'];
const supportedTargets = new Set(['chrome', 'edge', 'firefox']);
const viewport = { width: 1280, height: 800 };
const outputRoot = join(root, 'store-assets', 'screenshots');

for (const target of targets) {
  if (!supportedTargets.has(target)) throw new Error(`Unsupported screenshot target: ${target}`);
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableJson(child)]),
  );
}

async function loadArtifacts() {
  const checksumText = await readFile(join(root, 'dist', 'SHA256SUMS'), 'utf8');
  const checksums = new Map(
    checksumText
      .trim()
      .split('\n')
      .map((line) => {
        const [hash, filename] = line.trim().split(/\s+/, 2);
        return [filename, hash];
      }),
  );
  const artifacts = {};
  for (const target of supportedTargets) {
    const suffix = `-${target}.zip`;
    const filename = [...checksums.keys()].find((candidate) => candidate.endsWith(suffix));
    if (!filename) throw new Error(`dist/SHA256SUMS does not contain a ${target} release archive.`);
    const path = join(root, 'dist', filename);
    const buffer = await readFile(path);
    const actual = sha256(buffer);
    const expected = checksums.get(filename);
    if (actual !== expected) throw new Error(`${filename} does not match dist/SHA256SUMS.`);
    artifacts[target] = {
      filename,
      path,
      contentSha256: await hashArchiveContents(path),
    };
  }
  return artifacts;
}

function screenshotState() {
  const createdAt = '2026-09-02T00:00:00.000Z';
  const rules = [
    {
      schemaVersion: 1,
      id: 'upgrade-insecure',
      dnrId: 1_980_001,
      name: 'Upgrade insecure requests',
      enabled: true,
      priority: 30,
      condition: {
        url: { kind: 'wildcard', value: 'http://docs.example.com/*' },
        resourceTypes: ['main_frame', 'sub_frame'],
      },
      action: { kind: 'upgrade-scheme' },
      permissionOrigins: [],
      migrationState: 'none',
      createdAt,
      updatedAt: createdAt,
    },
    {
      schemaVersion: 1,
      id: 'block-tracking',
      dnrId: 1_980_002,
      name: 'Block tracking pixels',
      enabled: true,
      priority: 20,
      condition: {
        url: { kind: 'url-filter', value: '||analytics.example.com^' },
        resourceTypes: ['image', 'ping', 'xmlhttprequest'],
      },
      action: { kind: 'block' },
      permissionOrigins: [],
      migrationState: 'none',
      createdAt,
      updatedAt: createdAt,
    },
    {
      schemaVersion: 1,
      id: 'redirect-api',
      dnrId: 1_980_003,
      name: 'Redirect API requests',
      enabled: false,
      priority: 10,
      condition: {
        url: { kind: 'wildcard', value: 'https://api.example.com/v1/*' },
        resourceTypes: ['xmlhttprequest'],
        initiatorDomains: ['app.example.com'],
      },
      action: { kind: 'redirect', target: 'http://localhost:3000/v1/$1' },
      permissionOrigins: ['https://api.example.com/*'],
      migrationState: 'none',
      createdAt,
      updatedAt: createdAt,
    },
    {
      schemaVersion: 1,
      id: 'remove-debug-header',
      dnrId: 1_980_004,
      name: 'Remove debug header',
      enabled: false,
      priority: 5,
      condition: {
        url: { kind: 'wildcard', value: 'https://staging.example.com/*' },
        resourceTypes: ['xmlhttprequest'],
        initiatorDomains: ['app.example.com'],
      },
      action: {
        kind: 'modify-request-headers',
        operations: [{ header: 'X-Debug-Token', operation: 'remove' }],
      },
      permissionOrigins: ['https://staging.example.com/*'],
      migrationState: 'none',
      createdAt,
      updatedAt: createdAt,
    },
  ];
  return {
    schemaVersion: 1,
    rules: Object.fromEntries(rules.map((rule) => [rule.id, rule])),
    order: rules.map((rule) => rule.id),
    settings: { globallyPaused: false },
  };
}

function screenshotBackup() {
  const source = screenshotState();
  const sourceRules = source.order.slice(0, 3).map((sourceId, index) => {
    const original = source.rules[sourceId];
    const id = `shared-rule-${index + 1}`;
    return {
      ...original,
      id,
      dnrId: 1_981_001 + index,
      name: ['Block social widgets', 'Upgrade internal docs', 'Redirect staging API'][index],
    };
  });
  const state = {
    schemaVersion: 1,
    rules: Object.fromEntries(sourceRules.map((rule) => [rule.id, rule])),
    order: sourceRules.map((rule) => rule.id),
    settings: { globallyPaused: false },
  };
  const payload = {
    format: 'my-webrequest-rules',
    version: 1,
    exportedAt: '2026-09-02T00:00:00.000Z',
    state,
  };
  return JSON.stringify({
    ...payload,
    checksum: sha256(Buffer.from(JSON.stringify(stableJson(payload)))),
  });
}

async function settleChromiumPage(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.locator('h1').first().waitFor({ state: 'visible' });
  await page.evaluate(async () => document.fonts.ready);
  await page.waitForTimeout(150);
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  if (
    layout.clientWidth !== viewport.width ||
    layout.clientHeight !== viewport.height ||
    layout.scrollWidth !== viewport.width
  ) {
    throw new Error(`Unexpected Chromium screenshot layout: ${JSON.stringify(layout)}`);
  }
}

async function captureChromium(target, artifact) {
  const temporaryRoot = await mkdtemp(join(tmpdir(), `mwr-store-${target}-`));
  const extensionPath = join(temporaryRoot, 'extension');
  const profilePath = join(temporaryRoot, 'profile');
  await mkdir(extensionPath);
  await execFileAsync('unzip', ['-q', artifact.path, '-d', extensionPath]);

  const executablePath =
    target === 'edge'
      ? (process.env.MWR_EDGE_EXECUTABLE_PATH ??
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge')
      : chromium.executablePath();
  await access(executablePath);

  const context = await chromium.launchPersistentContext(profilePath, {
    executablePath,
    headless: true,
    viewport,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  try {
    let worker = context.serviceWorkers()[0];
    worker ??= await context.waitForEvent('serviceworker', { timeout: 10_000 });
    const extensionId = new URL(worker.url()).host;
    await worker.evaluate(
      async (state) =>
        chrome.storage.local.set({
          requestRulesState: state,
          'ui.locale': 'en',
        }),
      screenshotState(),
    );

    const page = await context.newPage();
    const consoleIssues = [];
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        consoleIssues.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => consoleIssues.push(`pageerror: ${error.message}`));
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await settleChromiumPage(page);

    const outputDirectory = join(outputRoot, target);
    await mkdir(outputDirectory, { recursive: true });
    const files = [];
    const capture = async (filename, purpose) => {
      const path = join(outputDirectory, filename);
      await page.screenshot({ path, animations: 'disabled' });
      files.push({ filename, purpose });
    };

    await capture('01-rules-overview.png', 'Rule list, live status, quota, and editor');
    const redirectRow = page.locator('button[data-rule-select="redirect-api"]').locator('..');
    await redirectRow.locator('[role="switch"]').click();
    await page.getByRole('dialog').waitFor({ state: 'visible' });
    await capture(
      '02-permission-explanation.png',
      'Bounded website-access explanation before browser prompt',
    );
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Backup & restore' }).click();
    await page.getByRole('heading', { name: 'Backup & restore' }).waitFor({ state: 'visible' });
    await page.evaluate((text) => {
      const input = document.querySelector('input[type="file"]');
      if (!(input instanceof HTMLInputElement)) throw new Error('Backup input is missing.');
      const transfer = new DataTransfer();
      transfer.items.add(new File([text], 'my-webrequest-rules.json', { type: 'application/json' }));
      Object.defineProperty(input, 'files', { configurable: true, value: transfer.files });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, screenshotBackup());
    await page.getByRole('heading', { name: 'Import preview' }).waitFor({ state: 'visible' });
    await capture('03-backup-restore.png', 'Local checksummed backup and safe import entry point');

    if (consoleIssues.length > 0) {
      throw new Error(`${target} emitted console issues: ${consoleIssues.join('\n')}`);
    }
    return {
      browserName: target === 'edge' ? 'Microsoft Edge' : 'Chromium',
      browserVersion: context.browser()?.version() ?? 'unknown',
      files,
    };
  } finally {
    await context.close();
    await rm(temporaryRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

async function reservePort() {
  const server = createServer();
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not reserve a GeckoDriver port.');
  await new Promise((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );
  return address.port;
}

async function captureFirefox(artifact) {
  const firefox =
    process.env.MWR_FIREFOX_EXECUTABLE_PATH ?? '/Applications/Firefox.app/Contents/MacOS/firefox';
  const geckodriver = process.env.MWR_GECKODRIVER_PATH;
  if (!geckodriver) throw new Error('MWR_GECKODRIVER_PATH is required to capture Firefox screenshots.');
  await Promise.all([access(firefox), access(geckodriver)]);

  const port = await reservePort();
  const driver = spawn(
    geckodriver,
    ['--allow-system-access', '--host', '127.0.0.1', '--port', String(port), '--log', 'info'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let logs = '';
  for (const stream of [driver.stdout, driver.stderr]) {
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      logs += chunk;
    });
  }
  let sessionId;

  const command = async (method, path, body) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.value?.error) {
      throw new Error(
        `WebDriver ${method} ${path} failed: ${payload.value?.message ?? response.statusText}\n${logs}`,
      );
    }
    return payload.value;
  };
  const executeAsync = (script, args = []) =>
    command('POST', `/session/${sessionId}/execute/async`, { script, args });
  const webdriverElementKey = 'element-6066-11e4-a52e-4f735466cecf';
  const poll = async (script, expected, timeout = 10_000) => {
    const startedAt = Date.now();
    let actual;
    while (Date.now() - startedAt < timeout) {
      actual = await executeAsync(
        `const done = arguments[arguments.length - 1]; Promise.resolve().then(async () => (${script})).then(done, (error) => done({ error: String(error) }));`,
      );
      if (JSON.stringify(stableJson(actual)) === JSON.stringify(stableJson(expected))) return;
      await new Promise((resolveWait) => setTimeout(resolveWait, 150));
    }
    throw new Error(`Firefox screenshot state did not converge: ${JSON.stringify(actual)}`);
  };
  const click = async (selector) => {
    const result = await executeAsync(
      `const selector = arguments[0]; const done = arguments[arguments.length - 1]; const element = document.querySelector(selector); if (!element) return done({ error: 'Missing ' + selector }); element.click(); done(true);`,
      [selector],
    );
    if (result?.error) throw new Error(result.error);
  };
  const clickNative = async (using, value) => {
    const elements = await command('POST', `/session/${sessionId}/elements`, { using, value });
    for (const element of elements) {
      const elementId = element[webdriverElementKey];
      if (
        elementId &&
        (await command('GET', `/session/${sessionId}/element/${elementId}/displayed`)) === true
      ) {
        await command('POST', `/session/${sessionId}/element/${elementId}/click`, {});
        return;
      }
    }
    throw new Error(`Firefox could not find a visible ${using}=${value}.`);
  };
  try {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (driver.exitCode !== null) throw new Error(`GeckoDriver exited before startup.\n${logs}`);
      try {
        const response = await fetch(`http://127.0.0.1:${port}/status`);
        if (response.ok) break;
      } catch {
        // GeckoDriver is still starting.
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
      if (attempt === 99) throw new Error(`GeckoDriver did not become ready.\n${logs}`);
    }
    const session = await command('POST', '/session', {
      capabilities: {
        alwaysMatch: {
          browserName: 'firefox',
          'moz:firefoxOptions': {
            binary: firefox,
            args: ['-headless', '-no-remote'],
            prefs: {
              'browser.shell.checkDefaultBrowser': false,
              'datareporting.healthreport.uploadEnabled': false,
              'datareporting.policy.dataSubmissionEnabled': false,
              'toolkit.telemetry.enabled': false,
              'ui.prefersReducedMotion': 1,
            },
          },
        },
      },
    });
    sessionId = session.sessionId;
    await command('POST', `/session/${sessionId}/timeouts`, {
      implicit: 0,
      pageLoad: 10_000,
      script: 15_000,
    });
    await command('POST', `/session/${sessionId}/window/rect`, { width: 1280, height: 900 });
    const addonId = await command('POST', `/session/${sessionId}/moz/addon/install`, {
      path: artifact.path,
      temporary: true,
    });
    if (addonId !== 'mywebrequest@evecalm.com') throw new Error(`Unexpected Firefox add-on ID: ${addonId}`);

    await command('POST', `/session/${sessionId}/moz/context`, { context: 'chrome' });
    const optionsUrl = await executeAsync(
      `const done = arguments[arguments.length - 1]; const policy = WebExtensionPolicy.getByID(${JSON.stringify('mywebrequest@evecalm.com')}); done(policy.getURL('options.html'));`,
    );
    await command('POST', `/session/${sessionId}/moz/context`, { context: 'content' });
    await command('POST', `/session/${sessionId}/url`, { url: optionsUrl });
    await poll(`document.title`, 'My Webrequest');
    await executeAsync(
      `const state = arguments[0]; const done = arguments[arguments.length - 1]; browser.storage.local.set({ requestRulesState: state, 'ui.locale': 'en' }).then(() => done(true), (error) => done({ error: String(error) }));`,
      [screenshotState()],
    );
    await poll(`document.querySelectorAll('button[data-rule-select]').length`, 4);

    const size = await executeAsync(
      `const done = arguments[arguments.length - 1]; done({ innerWidth, innerHeight, outerWidth, outerHeight });`,
    );
    await command('POST', `/session/${sessionId}/window/rect`, {
      width: viewport.width + (size.outerWidth - size.innerWidth),
      height: viewport.height + (size.outerHeight - size.innerHeight),
    });
    await poll(
      `({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth })`,
      {
        width: viewport.width,
        height: viewport.height,
        scrollWidth: viewport.width,
      },
    );
    await executeAsync(
      `const done = arguments[arguments.length - 1]; document.fonts.ready.then(() => setTimeout(() => done(true), 150));`,
    );

    const outputDirectory = join(outputRoot, 'firefox');
    await mkdir(outputDirectory, { recursive: true });
    const files = [];
    const capture = async (filename, purpose) => {
      const encoded = await command('GET', `/session/${sessionId}/screenshot`);
      await writeFile(join(outputDirectory, filename), Buffer.from(encoded, 'base64'));
      files.push({ filename, purpose });
    };

    await capture('01-rules-overview.png', 'Rule list, live status, quota, and editor');
    await click('button[data-rule-select="redirect-api"]');
    await click('button[data-rule-select="redirect-api"] + div [role="switch"]');
    await poll(`document.querySelector('[role="dialog"]') !== null`, true);
    await capture(
      '02-permission-explanation.png',
      'Bounded website-access explanation before browser prompt',
    );
    await command('POST', `/session/${sessionId}/url`, { url: optionsUrl });
    await poll(`document.title`, 'My Webrequest');
    await clickNative('css selector', 'button[aria-label="Settings"]');
    await poll(`document.body.innerText.includes('Backup & restore')`, true);
    await clickNative('xpath', `//*[@role='menuitem' and normalize-space(.)='Backup & restore']`);
    await poll(`document.body.innerText.includes('Export backup')`, true);
    await executeAsync(
      `const text = arguments[0]; const done = arguments[arguments.length - 1]; const input = document.querySelector('input[type="file"]'); if (!(input instanceof HTMLInputElement)) return done({ error: 'Backup input is missing.' }); const transfer = new DataTransfer(); transfer.items.add(new File([text], 'my-webrequest-rules.json', { type: 'application/json' })); Object.defineProperty(input, 'files', { configurable: true, value: transfer.files }); input.dispatchEvent(new Event('change', { bubbles: true })); done(true);`,
      [screenshotBackup()],
    );
    await poll(`document.body.innerText.includes('Import preview')`, true);
    await capture('03-backup-restore.png', 'Local checksummed backup and safe import entry point');

    return { browserName: 'Firefox', browserVersion: session.capabilities.browserVersion, files };
  } finally {
    if (sessionId) await command('DELETE', `/session/${sessionId}`).catch(() => undefined);
    if (driver.exitCode === null) driver.kill('SIGTERM');
  }
}

async function inspectPng(path) {
  const buffer = await readFile(path);
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') throw new Error(`${path} is not a PNG.`);
  return {
    sha256: sha256(buffer),
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

const artifacts = await loadArtifacts();
let existing = { schemaVersion: 2, viewport, targets: {} };
try {
  existing = JSON.parse(await readFile(join(outputRoot, 'manifest.json'), 'utf8'));
} catch {
  // The first capture creates the provenance manifest.
}

for (const target of targets) {
  const artifact = artifacts[target];
  const result =
    target === 'firefox' ? await captureFirefox(artifact) : await captureChromium(target, artifact);
  const files = [];
  for (const file of result.files) {
    const relativePath = join(target, file.filename);
    files.push({
      path: relativePath,
      purpose: file.purpose,
      ...(await inspectPng(join(outputRoot, relativePath))),
    });
  }
  existing.targets[target] = {
    sourceArtifact: artifact.filename,
    sourceContentSha256: artifact.contentSha256,
    browserName: result.browserName,
    browserVersion: result.browserVersion,
    capturedAt: new Date().toISOString(),
    files,
  };
  console.log(`Captured ${files.length} ${target} store screenshots from ${basename(artifact.path)}.`);
}

existing.schemaVersion = 2;
existing.viewport = viewport;
await mkdir(outputRoot, { recursive: true });
await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(existing, null, 2)}\n`);
