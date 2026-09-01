import path from 'node:path';

import { chromium, expect, test as base, type BrowserContext, type Worker } from '@playwright/test';

type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
  extensionWorker: Worker;
};

export const test = base.extend<ExtensionFixtures>({
  context: async ({ browserName, ignoreHTTPSErrors }, run) => {
    if (browserName !== 'chromium') throw new Error('Extension E2E requires Playwright Chromium.');
    const extensionPath = path.resolve(process.cwd(), 'dist/chrome-mv3');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: true,
      ignoreHTTPSErrors,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });

    await run(context);
    await context.close();
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
