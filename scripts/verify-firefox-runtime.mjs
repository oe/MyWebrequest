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
  const hits = { blocked: 0, control: 0 };
  const server = createHttpServer((request, response) => {
    if (request.url?.startsWith('/blocked')) hits.blocked += 1;
    if (request.url?.startsWith('/control')) hits.control += 1;
    response.setHeader('content-type', 'text/plain; charset=utf-8');
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

async function pollExtension(script, expected, timeout = 30_000) {
  const startedAt = Date.now();
  let actual;
  while (Date.now() - startedAt < timeout) {
    actual = await executeAsync(
      `const done = arguments[arguments.length - 1];
       Promise.resolve().then(async () => (${script})).then(done, (error) => done({ error: String(error) }));`,
    );
    if (actual?.error) throw new Error(actual.error);
    if (JSON.stringify(actual) === JSON.stringify(expected)) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error(
    `Firefox runtime state did not converge. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`,
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
          },
        },
      },
    },
  });
  sessionId = session.sessionId;
  await command('POST', `/session/${sessionId}/timeouts`, { implicit: 0, pageLoad: 8_000, script: 30_000 });

  const addonId = await command('POST', `/session/${sessionId}/moz/addon/install`, {
    path: artifact,
    temporary: true,
  });
  if (addonId !== 'mywebrequest@evecalm.com') {
    throw new Error(`Firefox installed an unexpected add-on ID: ${addonId}`);
  }

  await command('POST', `/session/${sessionId}/moz/context`, { context: 'chrome' });
  const optionsUrl = await executeAsync(
    `const done = arguments[arguments.length - 1];
     try {
       done(WebExtensionPolicy.getByID(${JSON.stringify(addonId)}).getURL('options.html'));
     } catch (error) {
       done({ error: String(error) });
     }`,
  );
  if (typeof optionsUrl !== 'string' || !optionsUrl.startsWith('moz-extension://')) {
    throw new Error(`Could not resolve the installed options URL: ${JSON.stringify(optionsUrl)}`);
  }
  await command('POST', `/session/${sessionId}/moz/context`, { context: 'content' });
  await command('POST', `/session/${sessionId}/url`, { url: optionsUrl });

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
    `Firefox runtime verifier passed on ${session.capabilities.browserVersion}: exact artifact install, hostless block and HTTPS upgrade, 900 regex rules, 4,500 total rules, and add-on reload recovery.`,
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
