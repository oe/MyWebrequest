import path from 'node:path';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import { chromium, expect, test as base, type BrowserContext, type Worker } from '@playwright/test';

type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
  extensionWorker: Worker;
};

async function isMyWebrequestWorker(worker: Worker): Promise<boolean> {
  return worker.evaluate(() => chrome.runtime?.getManifest().name === 'My Webrequest').catch(() => false);
}

export async function findExtensionWorker(context: BrowserContext): Promise<Worker> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    for (const worker of context.serviceWorkers()) {
      if (await isMyWebrequestWorker(worker)) return worker;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    const worker = await context
      .waitForEvent('serviceworker', { timeout: Math.min(remaining, 1_000) })
      .catch(() => undefined);
    if (worker && (await isMyWebrequestWorker(worker))) return worker;
  }
  throw new Error('My Webrequest service worker did not start.');
}

async function launchExternalChromium(
  executablePath: string,
  extensionPath: string,
  ignoreHTTPSErrors: boolean,
  requestedUserDataDir?: string,
): Promise<{ context: BrowserContext; close: () => Promise<void> }> {
  const ownsUserDataDir = requestedUserDataDir === undefined;
  const userDataDir = requestedUserDataDir ?? (await mkdtemp(path.join(tmpdir(), 'mwr-chromium-floor-')));
  const child = spawn(
    executablePath,
    [
      ...(process.env.MWR_CHROMIUM_HEADED === '1' ? [] : ['--headless=new']),
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--disable-background-mode',
      '--no-first-run',
      '--no-default-browser-check',
      '--no-sandbox',
      '--window-size=1280,900',
      ...(ignoreHTTPSErrors ? ['--ignore-certificate-errors'] : []),
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk: string) => {
    stderr += chunk;
  });

  let port: string | undefined;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) break;
    try {
      [port] = (await readFile(path.join(userDataDir, 'DevToolsActivePort'), 'utf8')).split('\n');
      if (port) break;
    } catch {
      // Chrome creates DevToolsActivePort after the profile is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!port) {
    child.kill('SIGTERM');
    if (ownsUserDataDir) await rm(userDataDir, { recursive: true, force: true });
    throw new Error(`External Chromium did not expose a debugging port. ${stderr}`.trim());
  }

  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const context = browser.contexts()[0];
  if (!context) throw new Error('External Chromium did not create a persistent context.');
  return {
    context,
    close: async () => {
      await browser.close();
      if (child.exitCode === null) child.kill('SIGTERM');
      if (child.exitCode === null) {
        await Promise.race([
          new Promise((resolveExit) => child.once('exit', resolveExit)),
          new Promise((resolveWait) => setTimeout(resolveWait, 2_000)),
        ]);
      }
      if (child.exitCode === null) child.kill('SIGKILL');
      if (ownsUserDataDir) {
        await rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      }
    },
  };
}

export async function launchChromiumExtensionContext(
  extensionPath: string,
  ignoreHTTPSErrors = false,
  userDataDir?: string,
): Promise<{ context: BrowserContext; close: () => Promise<void> }> {
  const executablePath = process.env.MWR_CHROMIUM_EXECUTABLE_PATH;
  if (executablePath) {
    return launchExternalChromium(executablePath, extensionPath, ignoreHTTPSErrors, userDataDir);
  }
  const context = await chromium.launchPersistentContext(userDataDir ?? '', {
    channel: 'chromium',
    headless: true,
    ignoreHTTPSErrors,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  return { context, close: () => context.close() };
}

export const test = base.extend<ExtensionFixtures>({
  context: async ({ browserName, ignoreHTTPSErrors }, run) => {
    if (browserName !== 'chromium') throw new Error('Extension E2E requires Playwright Chromium.');
    const target = process.env.MWR_BROWSER_TARGET === 'edge' ? 'edge' : 'chrome';
    const extensionPath = path.resolve(
      process.env.MWR_EXTENSION_PATH ?? path.join(process.cwd(), `dist/${target}-mv3`),
    );
    const launched = await launchChromiumExtensionContext(extensionPath, ignoreHTTPSErrors);
    try {
      await run(launched.context);
    } finally {
      await launched.close();
    }
  },
  extensionWorker: async ({ context }, run) => {
    const worker = await findExtensionWorker(context);
    await run(worker);
  },
  extensionId: async ({ extensionWorker }, run) => {
    const extensionId = new URL(extensionWorker.url()).host;
    await run(extensionId);
  },
});

export { expect };
