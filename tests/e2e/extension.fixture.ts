import path from 'node:path';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';

import {
  chromium,
  expect,
  test as base,
  type Browser,
  type BrowserContext,
  type Page,
  type Worker,
} from '@playwright/test';

import browserSupport from '../../browser-support.json' with { type: 'json' };

type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
  extensionPage: Page;
};

async function isMyWebrequestWorker(worker: Worker): Promise<boolean> {
  return worker.evaluate(() => chrome.runtime?.getManifest().name === 'My Webrequest').catch(() => false);
}

export async function findExtensionWorker(
  context: BrowserContext,
  expectedExtensionId?: string,
): Promise<Worker> {
  const matches = (worker: Worker) =>
    expectedExtensionId
      ? Promise.resolve(new URL(worker.url()).host === expectedExtensionId)
      : isMyWebrequestWorker(worker);
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    for (const worker of context.serviceWorkers()) {
      if (await matches(worker)) return worker;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    const worker = await context
      .waitForEvent('serviceworker', { timeout: Math.min(remaining, 1_000) })
      .catch(() => undefined);
    if (worker && (await matches(worker))) return worker;
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
  const activePortPath = path.join(userDataDir, 'DevToolsActivePort');
  await unlink(activePortPath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  });
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

  let browser: Browser | undefined;
  let connectionError: unknown;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) break;
    try {
      const [port] = (await readFile(activePortPath, 'utf8')).split('\n');
      if (port) {
        try {
          browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
          break;
        } catch (error) {
          connectionError = error;
        }
      }
    } catch {
      // Chrome creates DevToolsActivePort after the profile is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!browser) {
    child.kill('SIGTERM');
    if (ownsUserDataDir) await rm(userDataDir, { recursive: true, force: true });
    const connectionMessage = connectionError instanceof Error ? connectionError.message : '';
    throw new Error(
      `External Chromium did not accept a debugging connection. ${connectionMessage} ${stderr}`.trim(),
    );
  }

  const context = browser.contexts()[0];
  if (!context) throw new Error('External Chromium did not create a persistent context.');
  return {
    context,
    close: async () => {
      await Promise.all(context.pages().map((page) => page.close().catch(() => undefined)));
      await browser.close();
      if (child.exitCode === null) {
        await Promise.race([
          new Promise((resolveExit) => child.once('exit', resolveExit)),
          new Promise((resolveWait) => setTimeout(resolveWait, 3_000)),
        ]);
      }
      if (child.exitCode === null) {
        child.kill('SIGTERM');
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
  extensionId: async ({ context }, run) => {
    if (process.env.MWR_BROWSER_TARGET !== 'edge') {
      await run(browserSupport.chromeLegacyExtensionId);
      return;
    }
    const worker = await findExtensionWorker(context);
    await run(new URL(worker.url()).host);
  },
  extensionPage: async ({ context, extensionId }, run) => {
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/options.html`);
    await run(extensionPage);
    await extensionPage.close();
  },
});

export { expect };
