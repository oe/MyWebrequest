import { execFile, spawn } from 'node:child_process';
import { access, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { createServer as createNetServer } from 'node:net';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const firefox = process.env.MWR_FIREFOX_EXECUTABLE_PATH;
const geckodriver = process.env.MWR_GECKODRIVER_PATH;
if (!firefox) throw new Error('MWR_FIREFOX_EXECUTABLE_PATH is required.');
if (!geckodriver) throw new Error('MWR_GECKODRIVER_PATH is required.');
await Promise.all([access(firefox), access(geckodriver)]);

const distFiles = await readdir(join(process.cwd(), 'dist'));
const artifactName = distFiles.find(
  (name) => name.endsWith('-firefox.zip') && !name.endsWith('-sources.zip'),
);
if (!artifactName) throw new Error('Build the Firefox release archive before running the runtime verifier.');
const artifact = resolve('dist', artifactName);

async function reservePort() {
  const server = createNetServer();
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not reserve a local port.');
  await new Promise((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );
  return address.port;
}

async function waitForWebDriver(port, child, getLogs) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`GeckoDriver exited before startup.\n${getLogs()}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/status`);
      if (response.ok) return;
    } catch {
      // GeckoDriver opens the HTTP endpoint after initializing its logger.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`GeckoDriver did not become ready.\n${getLogs()}`);
}

async function startFixtureServer() {
  const hits = {
    blocked: 0,
    control: 0,
    redirectMisses: 0,
    redirectedPath: '',
    receivedHeader: '',
  };
  const server = createHttpServer((request, response) => {
    response.setHeader('access-control-allow-origin', '*');
    response.setHeader('content-type', 'text/plain; charset=utf-8');
    if (request.url?.startsWith('/blocked')) hits.blocked += 1;
    if (request.url?.startsWith('/control')) hits.control += 1;
    if (request.url?.startsWith('/redirect/')) {
      hits.redirectMisses += 1;
      response.end('redirect-rule-missed');
      return;
    }
    if (request.url?.startsWith('/target/')) {
      hits.redirectedPath = request.url;
      response.end(`redirected:${request.url}`);
      return;
    }
    if (request.url?.startsWith('/headers')) {
      hits.receivedHeader = String(request.headers['x-mwr-firefox'] ?? '');
      response.end(`header:${hits.receivedHeader}`);
      return;
    }
    response.end(request.url ?? '/');
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Firefox fixture did not expose a port.');
  return {
    hits,
    port: address.port,
    close: () =>
      new Promise((resolveClose, reject) => {
        server.closeAllConnections();
        server.close((error) => (error ? reject(error) : resolveClose()));
      }),
  };
}

async function localTlsCredentials() {
  const directory = await mkdtemp(join(tmpdir(), 'my-webrequest-firefox-tls-'));
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
    await rm(directory, { recursive: true, force: true });
  }
}

async function startTlsFixtureServer() {
  const credentials = await localTlsCredentials();
  let upgradeHits = 0;
  const server = createHttpsServer(credentials, (request, response) => {
    if (request.url?.startsWith('/upgrade')) upgradeHits += 1;
    response.setHeader('content-type', 'text/plain; charset=utf-8');
    response.end('upgrade-ok');
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Firefox TLS fixture did not expose a port.');
  return {
    get upgradeHits() {
      return upgradeHits;
    },
    port: address.port,
    close: () =>
      new Promise((resolveClose, reject) => {
        server.closeAllConnections();
        server.close((error) => (error ? reject(error) : resolveClose()));
      }),
  };
}

const driverPort = await reservePort();
const driver = spawn(
  geckodriver,
  ['--allow-system-access', '--host', '127.0.0.1', '--port', String(driverPort), '--log', 'info'],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
let driverLogs = '';
for (const stream of [driver.stdout, driver.stderr]) {
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    driverLogs += chunk;
  });
}

let sessionId;
let fixture;
let tlsFixture;

async function command(method, path, body) {
  const response = await fetch(`http://127.0.0.1:${driverPort}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.value?.error) {
    throw new Error(
      `WebDriver ${method} ${path} failed: ${payload.value?.message ?? response.statusText}\n${driverLogs}`,
    );
  }
  return payload.value;
}

async function executeAsync(script, args = []) {
  return command('POST', `/session/${sessionId}/execute/async`, { script, args });
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

async function pollExtension(script, expected, timeout = 30_000) {
  const startedAt = Date.now();
  let actual;
  while (Date.now() - startedAt < timeout) {
    actual = await executeAsync(
      `const done = arguments[arguments.length - 1];
       Promise.resolve().then(async () => (${script})).then(done, (error) => done({ error: String(error) }));`,
    );
    if (actual?.error) throw new Error(actual.error);
    if (JSON.stringify(stableJson(actual)) === JSON.stringify(stableJson(expected))) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error(
    `Firefox runtime state did not converge. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`,
  );
}

const webdriverElementKey = 'element-6066-11e4-a52e-4f735466cecf';

async function findElement(using, value, index) {
  const elements = await command('POST', `/session/${sessionId}/elements`, { using, value });
  if (index !== undefined) {
    const elementId = elements[index]?.[webdriverElementKey];
    if (!elementId) throw new Error(`Firefox could not find element ${using}=${value} at index ${index}.`);
    return elementId;
  }
  for (const element of elements) {
    const elementId = element[webdriverElementKey];
    if (
      elementId &&
      (await command('GET', `/session/${sessionId}/element/${elementId}/displayed`)) === true
    ) {
      return elementId;
    }
  }
  throw new Error(`Firefox could not find a visible element ${using}=${value}.`);
}

async function clickElement(using, value, index) {
  const elementId = await findElement(using, value, index);
  await command('POST', `/session/${sessionId}/element/${elementId}/click`, {});
}

async function sendElementKey(using, value, key, index) {
  const elementId = await findElement(using, value, index);
  await command('POST', `/session/${sessionId}/element/${elementId}/value`, {
    text: key,
    value: [key],
  });
}

const permissionProbeOrigins = [
  'http://127.0.0.1/*',
  'http://*.localhost/*',
  'https://*.localhost/*',
];

async function decideFixturePermission(allow) {
  await executeAsync(
    `const origins = arguments[0];
     const done = arguments[arguments.length - 1];
     let button = document.querySelector('#firefox-floor-permission-probe');
     if (!button) {
       button = document.createElement('button');
       button.id = 'firefox-floor-permission-probe';
       button.textContent = 'Grant fixture access';
       button.addEventListener('click', () => {
         button.dataset.result = 'pending';
         delete button.dataset.error;
         browser.permissions.request({ origins }).then(
           (granted) => { button.dataset.result = String(granted); },
           (error) => { button.dataset.error = String(error); },
         );
       });
       document.body.append(button);
     }
     done(true);`,
    [permissionProbeOrigins],
  );
  await clickElement('css selector', '#firefox-floor-permission-probe');

  await command('POST', `/session/${sessionId}/moz/context`, { context: 'chrome' });
  let prompt;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    prompt = await executeAsync(
      `const done = arguments[arguments.length - 1];
       const panel = document.querySelector('#notification-popup');
       done({
         panelState: panel?.state ?? null,
         panelText: panel?.textContent ?? '',
         buttons: [...document.querySelectorAll('#notification-popup button')]
           .map((button) => button.label)
           .filter(Boolean),
         notifications: [...document.querySelectorAll('#notification-popup popupnotification')]
           .map((item) => ({ id: item.id, name: item.getAttribute('name') })),
       });`,
    );
    if (prompt.panelState === 'open' && prompt.notifications.length > 0) break;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  if (
    prompt?.panelState !== 'open' ||
    !prompt.panelText.includes('localhost') ||
    !prompt.panelText.includes('127.0.0.1') ||
    prompt.notifications[0]?.id !== 'addon-webext-permissions-notification' ||
    prompt.notifications[0]?.name !== 'My Webrequest'
  ) {
    throw new Error(`Firefox permission prompt did not describe the bounded fixture origins: ${JSON.stringify(prompt)}`);
  }

  const actionLabel = allow ? 'Allow' : 'Deny';
  const actionResult = await executeAsync(
    `const actionLabel = arguments[0];
     const done = arguments[arguments.length - 1];
     const button = [...document.querySelectorAll('#notification-popup button')]
       .find((candidate) => candidate.label === actionLabel);
     if (!button) return done({ error: actionLabel + ' button is missing.' });
     button.click();
     done(true);`,
    [actionLabel],
  );
  if (actionResult?.error) throw new Error(actionResult.error);
  await command('POST', `/session/${sessionId}/moz/context`, { context: 'content' });
  await pollExtension(
    `document.querySelector('#firefox-floor-permission-probe')?.dataset.result ?? null`,
    String(allow),
  );
}

try {
  await waitForWebDriver(driverPort, driver, () => driverLogs);
  fixture = await startFixtureServer();
  tlsFixture = await startTlsFixtureServer();

  const session = await command('POST', '/session', {
    capabilities: {
      alwaysMatch: {
        browserName: 'firefox',
        acceptInsecureCerts: true,
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
  await command('POST', `/session/${sessionId}/timeouts`, { implicit: 0, pageLoad: 8_000, script: 30_000 });
  await command('POST', `/session/${sessionId}/window/rect`, { width: 1280, height: 900 });

  const addonId = await command('POST', `/session/${sessionId}/moz/addon/install`, {
    path: artifact,
    temporary: true,
  });
  if (addonId !== 'mywebrequest@evecalm.com') {
    throw new Error(`Firefox installed an unexpected add-on ID: ${addonId}`);
  }

  await command('POST', `/session/${sessionId}/moz/context`, { context: 'chrome' });
  const extensionUrls = await executeAsync(
    `const done = arguments[arguments.length - 1];
     try {
       const policy = WebExtensionPolicy.getByID(${JSON.stringify(addonId)});
       done({ options: policy.getURL('options.html'), popup: policy.getURL('popup.html') });
     } catch (error) {
       done({ error: String(error) });
     }`,
  );
  if (
    typeof extensionUrls?.options !== 'string' ||
    !extensionUrls.options.startsWith('moz-extension://') ||
    typeof extensionUrls?.popup !== 'string' ||
    !extensionUrls.popup.startsWith('moz-extension://')
  ) {
    throw new Error(`Could not resolve the installed extension URLs: ${JSON.stringify(extensionUrls)}`);
  }
  const optionsUrl = extensionUrls.options;
  const popupUrl = extensionUrls.popup;
  await command('POST', `/session/${sessionId}/moz/context`, { context: 'content' });
  await command('POST', `/session/${sessionId}/url`, { url: optionsUrl });

  await pollExtension(
    `({
       appName: document.body?.innerText.includes('My Webrequest') ?? false,
       lang: document.documentElement.lang,
       title: document.title,
     })`,
    { appName: true, lang: 'en', title: 'My Webrequest' },
  );
  const accessibilityState = await executeAsync(
    `const done = arguments[arguments.length - 1];
     const header = document.querySelector('[data-material="glass-bar"]');
     const settings = document.querySelector('button[aria-label="Settings"]');
     const transitionDurations = settings
       ? getComputedStyle(settings).transitionDuration.split(',').map((duration) => Number.parseFloat(duration))
       : [];
     done({
       reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
       transitionSeconds: transitionDurations.length ? Math.max(...transitionDurations) : null,
       hasLegacyEntry: document.body.innerText.includes('Legacy migration'),
       hasHeader: Boolean(header),
       hasSettings: Boolean(settings),
     });`,
  );
  if (
    accessibilityState.reducedMotion !== true ||
    accessibilityState.transitionSeconds === null ||
    accessibilityState.transitionSeconds > 0.001 ||
    accessibilityState.hasLegacyEntry ||
    !accessibilityState.hasHeader ||
    !accessibilityState.hasSettings
  ) {
    throw new Error(`Firefox options accessibility smoke failed: ${JSON.stringify(accessibilityState)}`);
  }

  await sendElementKey('css selector', 'button[aria-label="Settings"]', '\uE007');
  await pollExtension(
    `({
       backup: document.body.innerText.includes('Backup & restore'),
       legacy: document.body.innerText.includes('Legacy migration'),
     })`,
    { backup: true, legacy: false },
  );
  await sendElementKey(
    'xpath',
    `//*[@role='menuitem' and normalize-space(.)='Backup & restore']`,
    '\uE00C',
  );
  await pollExtension(
    `document.activeElement?.getAttribute('aria-label') ?? null`,
    'Settings',
  );

  const localeLabels = {
    en: 'Settings',
    'zh-CN': '设置',
    ko: '설정',
    ja: '設定',
    fr: 'Paramètres',
    es: 'Configuración',
  };
  for (const [locale, settingsLabel] of Object.entries(localeLabels)) {
    const localeStored = await executeAsync(
      `const locale = arguments[0];
       const done = arguments[arguments.length - 1];
       browser.storage.local.set({ 'ui.locale': locale }).then(() => done(true), (error) => done({ error: String(error) }));`,
      [locale],
    );
    if (localeStored?.error) throw new Error(localeStored.error);
    await pollExtension(
      `({
         lang: document.documentElement.lang,
         settings: document.querySelector('button[aria-label=${JSON.stringify(settingsLabel)}]') !== null,
       })`,
      { lang: locale, settings: true },
    );
  }
  await executeAsync(
    `const done = arguments[arguments.length - 1];
     browser.storage.local.set({ 'ui.locale': 'en' }).then(() => done(true), (error) => done({ error: String(error) }));`,
  );
  await pollExtension(`document.documentElement.lang`, 'en');

  await command('POST', `/session/${sessionId}/moz/context`, { context: 'chrome' });
  const zoomApplied = await executeAsync(
    `const done = arguments[arguments.length - 1];
     try {
       ZoomManager.setZoomForBrowser(gBrowser.selectedBrowser, 2);
       done(ZoomManager.getZoomForBrowser(gBrowser.selectedBrowser));
     } catch (error) {
       done({ error: String(error) });
     }`,
  );
  if (zoomApplied !== 2) throw new Error(`Firefox could not apply 200% zoom: ${JSON.stringify(zoomApplied)}`);
  await command('POST', `/session/${sessionId}/moz/context`, { context: 'content' });
  await pollExtension(
    `({
       clientWidth: document.documentElement.clientWidth,
       noHorizontalOverflow: document.documentElement.scrollWidth === document.documentElement.clientWidth,
     })`,
    { clientWidth: 640, noHorizontalOverflow: true },
  );
  await command('POST', `/session/${sessionId}/moz/context`, { context: 'chrome' });
  await executeAsync(
    `const done = arguments[arguments.length - 1];
     ZoomManager.setZoomForBrowser(gBrowser.selectedBrowser, 1);
     done(ZoomManager.getZoomForBrowser(gBrowser.selectedBrowser));`,
  );
  await command('POST', `/session/${sessionId}/moz/context`, { context: 'content' });

  await executeAsync(
    `const done = arguments[arguments.length - 1];
     const now = new Date().toISOString();
     const rule = {
       schemaVersion: 1,
       id: 'firefox-floor-backup-source',
       dnrId: 1920001,
       name: 'Firefox floor backup source',
       enabled: true,
       priority: 10,
       condition: {
         url: { kind: 'wildcard', value: 'https://backup-source.example/*' },
         resourceTypes: ['main_frame'],
       },
       action: { kind: 'block' },
       permissionOrigins: [],
       migrationState: 'none',
       createdAt: now,
       updatedAt: now,
     };
     browser.storage.local.set({
       requestRulesState: {
         schemaVersion: 1,
         rules: { [rule.id]: rule },
         order: [rule.id],
         settings: { globallyPaused: false },
       },
     }).then(() => done(true), (error) => done({ error: String(error) }));`,
  );
  await clickElement('css selector', 'button[aria-label="Settings"]');
  await clickElement('xpath', `//*[@role='menuitem' and normalize-space(.)='Backup & restore']`);
  await pollExtension(`document.body.innerText.includes('Export backup')`, true);
  await executeAsync(
    `const done = arguments[arguments.length - 1];
     const original = URL.createObjectURL.bind(URL);
     window.__mwrOriginalCreateObjectURL = original;
     URL.createObjectURL = (blob) => {
       void blob.text().then((text) => { window.__mwrExportedBackup = text; });
       return original(blob);
     };
     done(true);`,
  );
  await clickElement('xpath', `//button[normalize-space(.)='Export backup']`);
  let exportedBackupText;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    exportedBackupText = await executeAsync(
      `const done = arguments[arguments.length - 1];
       done(window.__mwrExportedBackup ?? null);`,
    );
    if (typeof exportedBackupText === 'string') break;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  if (typeof exportedBackupText !== 'string') {
    throw new Error('Firefox backup export did not produce JSON.');
  }
  const exportedBackup = JSON.parse(exportedBackupText);
  if (
    exportedBackup.format !== 'my-webrequest-rules' ||
    exportedBackup.version !== 1 ||
    exportedBackup.state?.order?.[0] !== 'firefox-floor-backup-source' ||
    !/^[a-f0-9]{64}$/.test(exportedBackup.checksum ?? '')
  ) {
    throw new Error(`Firefox backup export was malformed: ${exportedBackupText}`);
  }

  await executeAsync(
    `const done = arguments[arguments.length - 1];
     const now = new Date().toISOString();
     const rule = {
       schemaVersion: 1,
       id: 'firefox-floor-backup-current',
       dnrId: 1920002,
       name: 'Firefox floor backup current',
       enabled: false,
       priority: 10,
       condition: {
         url: { kind: 'wildcard', value: 'https://backup-current.example/*' },
         resourceTypes: ['main_frame'],
       },
       action: { kind: 'block' },
       permissionOrigins: [],
       migrationState: 'none',
       createdAt: now,
       updatedAt: now,
     };
     browser.storage.local.set({
       requestRulesState: {
         schemaVersion: 1,
         rules: { [rule.id]: rule },
         order: [rule.id],
         settings: { globallyPaused: false },
       },
     }).then(() => done(true), (error) => done({ error: String(error) }));`,
  );
  const stagedBackup = await executeAsync(
    `const text = arguments[0];
     const done = arguments[arguments.length - 1];
     const input = document.querySelector('input[type="file"]');
     if (!input) return done({ error: 'Backup input is missing.' });
     const transfer = new DataTransfer();
     transfer.items.add(new File([text], 'firefox-floor-backup.json', { type: 'application/json' }));
     input.files = transfer.files;
     input.dispatchEvent(new Event('change', { bubbles: true }));
     done(true);`,
    [exportedBackupText],
  );
  if (stagedBackup?.error) throw new Error(stagedBackup.error);
  await pollExtension(
    `({
       preview: document.body.innerText.includes('Import preview'),
       verified: document.body.innerText.includes('Checksum verified'),
     })`,
    { preview: true, verified: true },
  );
  await clickElement('xpath', `//button[normalize-space(.)='Apply import']`);
  await pollExtension(
    `(() => {
       const state = browser.storage.local.get('requestRulesState');
       return state.then(({ requestRulesState }) => ({
         enabled: requestRulesState.rules['firefox-floor-backup-source']?.enabled,
         order: [...requestRulesState.order].sort(),
       }));
     })()`,
    {
      enabled: false,
      order: ['firefox-floor-backup-current', 'firefox-floor-backup-source'],
    },
  );
  await clickElement('xpath', `//button[normalize-space(.)='Rules']`);
  await pollExtension(`document.body.innerText.includes('Firefox floor backup source')`, true);

  const extensionHandle = await command('GET', `/session/${sessionId}/window`);
  const testWindow = await command('POST', `/session/${sessionId}/window/new`, { type: 'tab' });
  await command('POST', `/session/${sessionId}/window`, { handle: testWindow.handle });
  await command('POST', `/session/${sessionId}/url`, {
    url: `http://127.0.0.1:${fixture.port}/control`,
  });
  if (fixture.hits.control !== 1) throw new Error('Firefox control navigation did not reach the fixture.');
  await command('POST', `/session/${sessionId}/window`, { handle: extensionHandle });

  await executeAsync(
    `const done = arguments[arguments.length - 1];
     const now = new Date().toISOString();
     const rule = {
       schemaVersion: 1,
       id: 'firefox-floor-block',
       dnrId: 1930001,
       name: 'Firefox floor block',
       enabled: true,
       priority: 10,
       condition: {
         url: { kind: 'wildcard', value: ${JSON.stringify(`http://127.0.0.1:${fixture.port}/blocked*`)} },
         resourceTypes: ['main_frame'],
       },
       action: { kind: 'block' },
       permissionOrigins: [],
       migrationState: 'none',
       createdAt: now,
       updatedAt: now,
     };
     browser.storage.local.set({
       requestRulesState: {
         schemaVersion: 1,
         rules: { [rule.id]: rule },
         order: [rule.id],
         settings: { globallyPaused: false },
       },
     }).then(() => done(true), (error) => done({ error: String(error) }));`,
  );
  await pollExtension(
    `(await browser.declarativeNetRequest.getDynamicRules()).map((rule) => rule.id)`,
    [1_930_001],
  );

  await command('POST', `/session/${sessionId}/window`, { handle: testWindow.handle });
  await command('POST', `/session/${sessionId}/url`, {
    url: `http://127.0.0.1:${fixture.port}/blocked?probe=1`,
  }).catch(() => undefined);
  if (fixture.hits.blocked !== 0) throw new Error('Firefox floor did not block the fixture navigation.');
  await command('POST', `/session/${sessionId}/window`, { handle: extensionHandle });

  await executeAsync(
    `const done = arguments[arguments.length - 1];
     const now = new Date().toISOString();
     const rule = {
       schemaVersion: 1,
       id: 'firefox-floor-upgrade',
       dnrId: 1930002,
       name: 'Firefox floor HTTPS upgrade',
       enabled: true,
       priority: 10,
       condition: {
         url: { kind: 'wildcard', value: ${JSON.stringify(`http://127.0.0.1:${tlsFixture.port}/upgrade*`)} },
         resourceTypes: ['main_frame'],
       },
       action: { kind: 'upgrade-scheme' },
       permissionOrigins: [],
       migrationState: 'none',
       createdAt: now,
       updatedAt: now,
     };
     browser.storage.local.set({
       requestRulesState: {
         schemaVersion: 1,
         rules: { [rule.id]: rule },
         order: [rule.id],
         settings: { globallyPaused: false },
       },
     }).then(() => done(true), (error) => done({ error: String(error) }));`,
  );
  await pollExtension(
    `(await browser.declarativeNetRequest.getDynamicRules()).map((rule) => rule.id)`,
    [1_930_002],
  );
  const grantedOrigins = await executeAsync(
    `const done = arguments[arguments.length - 1];
     browser.permissions.getAll().then(
       (permissions) => done(permissions.origins ?? []),
       (error) => done({ error: String(error) }),
     );`,
  );
  if (!Array.isArray(grantedOrigins) || grantedOrigins.length !== 0) {
    throw new Error(`Firefox floor unexpectedly granted host access: ${JSON.stringify(grantedOrigins)}`);
  }

  await command('POST', `/session/${sessionId}/window`, { handle: testWindow.handle });
  await command('POST', `/session/${sessionId}/url`, {
    url: `http://127.0.0.1:${tlsFixture.port}/upgrade?probe=1`,
  });
  const upgradedUrl = await command('GET', `/session/${sessionId}/url`);
  if (!upgradedUrl.startsWith(`https://127.0.0.1:${tlsFixture.port}/upgrade`)) {
    throw new Error(`Firefox floor did not upgrade the fixture navigation: ${upgradedUrl}`);
  }
  if (tlsFixture.upgradeHits !== 1)
    throw new Error('Firefox floor HTTPS fixture was not reached exactly once.');
  await command('POST', `/session/${sessionId}/window`, { handle: extensionHandle });

  await executeAsync(
    `const port = arguments[0];
     const done = arguments[arguments.length - 1];
     const now = new Date().toISOString();
     const rules = [
       {
         schemaVersion: 1,
         id: 'firefox-floor-cross-origin-redirect',
         dnrId: 1930003,
         name: 'Firefox floor cross-origin redirect',
         enabled: true,
         priority: 20,
         condition: {
           url: { kind: 'wildcard', value: 'http://127.0.0.1:' + port + '/redirect/*' },
           resourceTypes: ['xmlhttprequest'],
           initiatorDomains: ['localhost'],
         },
         action: { kind: 'redirect', target: 'http://localhost:' + port + '/target/$1' },
         permissionOrigins: ['http://127.0.0.1/*'],
         migrationState: 'none',
         createdAt: now,
         updatedAt: now,
       },
       {
         schemaVersion: 1,
         id: 'firefox-floor-cross-origin-header',
         dnrId: 1930004,
         name: 'Firefox floor cross-origin header',
         enabled: true,
         priority: 10,
         condition: {
           url: { kind: 'wildcard', value: 'http://127.0.0.1:' + port + '/headers*' },
           resourceTypes: ['xmlhttprequest'],
           initiatorDomains: ['localhost'],
         },
         action: {
           kind: 'modify-request-headers',
           operations: [{ header: 'X-MWR-Firefox', operation: 'set', value: 'cross-origin-pass' }],
         },
         permissionOrigins: ['http://127.0.0.1/*'],
         migrationState: 'none',
         createdAt: now,
         updatedAt: now,
       },
     ];
     browser.storage.local.set({
       requestRulesState: {
         schemaVersion: 1,
         rules: Object.fromEntries(rules.map((rule) => [rule.id, rule])),
         order: rules.map((rule) => rule.id),
         settings: { globallyPaused: false },
       },
     }).then(() => done(true), (error) => done({ error: String(error) }));`,
    [fixture.port],
  );
  await pollExtension(`(await browser.declarativeNetRequest.getDynamicRules()).length`, 0);

  await decideFixturePermission(false);
  await pollExtension(
    `({
       ids: (await browser.declarativeNetRequest.getDynamicRules()).map((rule) => rule.id),
       origins: (await browser.permissions.getAll()).origins?.sort() ?? [],
     })`,
    { ids: [], origins: [] },
  );

  await decideFixturePermission(true);
  await pollExtension(
    `({
       ids: (await browser.declarativeNetRequest.getDynamicRules()).map((rule) => rule.id).sort(),
       origins: (await browser.permissions.getAll()).origins?.sort() ?? [],
     })`,
    {
      ids: [1_930_003, 1_930_004],
      origins: ['http://*.localhost/*', 'http://127.0.0.1/*', 'https://*.localhost/*'],
    },
  );

  await command('POST', `/session/${sessionId}/window`, { handle: testWindow.handle });
  await command('POST', `/session/${sessionId}/url`, {
    url: `http://localhost:${fixture.port}/app`,
  });
  const crossOriginResult = await executeAsync(
    `const port = arguments[0];
     const done = arguments[arguments.length - 1];
     Promise.all([
       fetch('http://127.0.0.1:' + port + '/redirect/captured-value'),
       fetch('http://127.0.0.1:' + port + '/headers?probe=1'),
     ]).then(async ([redirect, header]) => done({
       redirect: await redirect.text(),
       redirectUrl: redirect.url,
       header: await header.text(),
     }), (error) => done({ error: String(error) }));`,
    [fixture.port],
  );
  const expectedCrossOriginResult = {
    redirect: 'redirected:/target/captured-value',
    redirectUrl: `http://localhost:${fixture.port}/target/captured-value`,
    header: 'header:cross-origin-pass',
  };
  if (JSON.stringify(stableJson(crossOriginResult)) !== JSON.stringify(stableJson(expectedCrossOriginResult))) {
    throw new Error(`Firefox cross-origin rules produced an unexpected result: ${JSON.stringify(crossOriginResult)}`);
  }
  if (
    fixture.hits.redirectMisses !== 0 ||
    fixture.hits.redirectedPath !== '/target/captured-value' ||
    fixture.hits.receivedHeader !== 'cross-origin-pass'
  ) {
    throw new Error(`Firefox cross-origin fixtures were not modified as expected: ${JSON.stringify(fixture.hits)}`);
  }

  await command('POST', `/session/${sessionId}/window`, { handle: extensionHandle });
  const removedOrigins = await executeAsync(
    `const origins = arguments[0];
     const done = arguments[arguments.length - 1];
     browser.permissions.remove({ origins }).then(done, (error) => done({ error: String(error) }));`,
    [permissionProbeOrigins],
  );
  if (removedOrigins !== true) throw new Error('Firefox did not revoke the fixture host access.');
  await pollExtension(
    `({
       enabled: Object.values((await browser.storage.local.get('requestRulesState')).requestRulesState.rules)
         .map((rule) => rule.enabled),
       ids: (await browser.declarativeNetRequest.getDynamicRules()).map((rule) => rule.id),
       origins: (await browser.permissions.getAll()).origins?.sort() ?? [],
     })`,
    { enabled: [true, true], ids: [], origins: [] },
  );

  await decideFixturePermission(true);
  await pollExtension(
    `({
       ids: (await browser.declarativeNetRequest.getDynamicRules()).map((rule) => rule.id).sort(),
       origins: (await browser.permissions.getAll()).origins?.sort() ?? [],
     })`,
    {
      ids: [1_930_003, 1_930_004],
      origins: ['http://*.localhost/*', 'http://127.0.0.1/*', 'https://*.localhost/*'],
    },
  );

  const popupWindow = await command('POST', `/session/${sessionId}/window/new`, { type: 'tab' });
  await command('POST', `/session/${sessionId}/window`, { handle: popupWindow.handle });
  await command('POST', `/session/${sessionId}/url`, { url: popupUrl });
  await pollExtension(
    `({
       appName: document.body?.innerText.includes('My Webrequest') ?? false,
       lang: document.documentElement.lang,
       pauseControl: document.querySelector('[role="switch"][aria-label="Pause all rules"]') !== null,
       title: document.title,
     })`,
    { appName: true, lang: 'en', pauseControl: true, title: 'My Webrequest' },
  );
  await clickElement('css selector', '[role="switch"][aria-label="Pause all rules"]');
  await pollExtension(
    `({
       dynamicCount: (await browser.declarativeNetRequest.getDynamicRules()).length,
       paused: (await browser.storage.local.get('requestRulesState')).requestRulesState.settings.globallyPaused,
     })`,
    { dynamicCount: 0, paused: true },
  );
  await command('POST', `/session/${sessionId}/window`, { handle: extensionHandle });
  await pollExtension(`document.body.innerText.includes('Paused')`, true);
  await command('POST', `/session/${sessionId}/window`, { handle: popupWindow.handle });
  await clickElement('css selector', '[role="switch"][aria-label="Pause all rules"]');
  await pollExtension(
    `({
       ids: (await browser.declarativeNetRequest.getDynamicRules()).map((rule) => rule.id).sort(),
       paused: (await browser.storage.local.get('requestRulesState')).requestRulesState.settings.globallyPaused,
     })`,
    { ids: [1_930_003, 1_930_004], paused: false },
  );
  await command('DELETE', `/session/${sessionId}/window`);
  await command('POST', `/session/${sessionId}/window`, { handle: extensionHandle });

  const installQuotaState = async (count, kind) => {
    const result = await executeAsync(
      `const count = arguments[0];
       const kind = arguments[1];
       const done = arguments[arguments.length - 1];
       const now = new Date().toISOString();
       const rules = {};
       const order = [];
       for (let index = 0; index < count; index += 1) {
         const id = 'firefox-' + kind + '-quota-' + index;
         order.push(id);
         rules[id] = {
           schemaVersion: 1,
           id,
           dnrId: (kind === 'regex' ? 1940000 : 1950000) + index,
           name: kind + ' quota ' + index,
           enabled: true,
           priority: 10,
           condition: {
             url: kind === 'regex'
               ? { kind: 'regex', value: '^https://firefox-regex-' + index + '\\\\.example/.*$' }
               : { kind: 'url-filter', value: '||firefox-filter-' + index + '.example^' },
             resourceTypes: ['main_frame'],
           },
           action: { kind: 'block' },
           permissionOrigins: [],
           migrationState: 'none',
           createdAt: now,
           updatedAt: now,
         };
       }
       browser.storage.local.set({
         requestRulesState: {
           schemaVersion: 1,
           rules,
           order,
           settings: { globallyPaused: false },
         },
       }).then(() => done(true), (error) => done({ error: String(error) }));`,
      [count, kind],
    );
    if (result?.error) throw new Error(result.error);
  };

  await installQuotaState(902, 'regex');
  await pollExtension(
    `(async () => {
       const ids = (await browser.declarativeNetRequest.getDynamicRules()).map((rule) => rule.id).sort((a, b) => a - b);
       return { count: ids.length, first: ids[0], last: ids.at(-1) };
     })()`,
    { count: 900, first: 1_940_000, last: 1_940_899 },
    60_000,
  );

  await installQuotaState(4_502, 'url-filter');
  await pollExtension(
    `(async () => {
       const ids = (await browser.declarativeNetRequest.getDynamicRules()).map((rule) => rule.id).sort((a, b) => a - b);
       return { count: ids.length, first: ids[0], last: ids.at(-1) };
     })()`,
    { count: 4_500, first: 1_950_000, last: 1_954_499 },
    60_000,
  );

  await executeAsync(
    `const done = arguments[arguments.length - 1];
     browser.runtime.reload();
     setTimeout(() => done(true), 0);`,
  ).catch(() => undefined);
  await new Promise((resolveWait) => setTimeout(resolveWait, 1_000));
  const remainingHandles = await command('GET', `/session/${sessionId}/window/handles`);
  const recoveryHandle = remainingHandles.find((handle) => handle !== extensionHandle);
  if (!recoveryHandle) throw new Error('Firefox add-on reload left no surviving content tab.');
  await command('POST', `/session/${sessionId}/window`, { handle: recoveryHandle });
  await command('POST', `/session/${sessionId}/url`, { url: optionsUrl });
  await pollExtension(`(await browser.declarativeNetRequest.getDynamicRules()).length`, 4_500, 60_000);

  console.log(
    `Firefox runtime verifier passed on ${session.capabilities.browserVersion}: exact artifact install, six locales, keyboard/reduced-motion/200% zoom accessibility, verified backup export/import, popup storage synchronization, hostless block and HTTPS upgrade, permission denial/grant/revocation/re-grant, cross-origin redirect/header enforcement, 900 regex rules, 4,500 total rules, and add-on reload recovery.`,
  );
} catch (error) {
  if (driverLogs) console.error(driverLogs);
  throw error;
} finally {
  if (sessionId) await command('DELETE', `/session/${sessionId}`).catch(() => undefined);
  if (fixture) await fixture.close().catch(() => undefined);
  if (tlsFixture) await tlsFixture.close().catch(() => undefined);
  if (driver.exitCode === null) driver.kill('SIGTERM');
}
