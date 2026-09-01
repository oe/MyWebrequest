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

async function launchExternalChromium(
  executablePath: string,
  extensionPath: string,
  ignoreHTTPSErrors: boolean,
): Promise<{ context: BrowserContext; close: () => Promise<void> }> {
  const userDataDir = await mkdtemp(path.join(tmpdir(), 'mwr-chromium-floor-'));
  const child = spawn(
    executablePath,
    [
      ...(process.env.MWR_CHROMIUM_HEADED === '1' ? [] : ['--headless=new']),
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--no-sandbox',
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
    await rm(userDataDir, { recursive: true, force: true });
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
      await rm(userDataDir, { recursive: true, force: true });
    },
  };
}

export async function launchChromiumExtensionContext(
  extensionPath: string,
  ignoreHTTPSErrors = false,
): Promise<{ context: BrowserContext; close: () => Promise<void> }> {
  const executablePath = process.env.MWR_CHROMIUM_EXECUTABLE_PATH;
  if (executablePath) {
    return launchExternalChromium(executablePath, extensionPath, ignoreHTTPSErrors);
  }
  const context = await chromium.launchPersistentContext('', {
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
    const extensionPath = path.resolve(process.cwd(), 'dist/chrome-mv3');
    const launched = await launchChromiumExtensionContext(extensionPath, ignoreHTTPSErrors);
    await run(launched.context);
    await launched.close();
  },
  extensionWorker: async ({ context }, run) => {
    let [worker] = context.serviceWorkers();
    worker ??= await context.waitForEvent('serviceworker');
    await run(worker);
  },
  extensionId: async ({ extensionWorker }, run) => {
    const extensionId = new URL(extensionWorker.url()).host;
    await run(extensionId);
  },
});

export { expect };
