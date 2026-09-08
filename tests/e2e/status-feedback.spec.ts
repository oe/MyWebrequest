/// <reference types="chrome" />
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Rule, StoredState } from '@/domain/rules/model';
import { expect, test, launchChromiumExtensionContext, findExtensionWorker } from './extension.fixture';

function stateFor(rule: Rule): StoredState {
  return {
    schemaVersion: 1,
    rules: { [rule.id]: rule },
    order: [rule.id],
    settings: { globallyPaused: false },
  };
}
function blockRule(): Rule {
  return {
    schemaVersion: 1,
    id: 'feedback-block',
    dnrId: 1999001,
    name: 'Feedback block rule',
    enabled: true,
    priority: 10,
    condition: { url: { kind: 'url-filter', value: '/blocked' } },
    action: { kind: 'block' },
    permissionOrigins: [],
    migrationState: 'none',
    createdAt: '2026-09-08T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
  };
}
const evidence = '/tmp/requestorbit-feedback';

test('popup pause persists in toolbar and settings expose forth.ink', async ({
  context,
  extensionPage,
  extensionId,
}) => {
  await mkdir(evidence, { recursive: true });
  const errors: string[] = [];
  extensionPage.on('pageerror', (error) => errors.push(error.message));
  await extensionPage.evaluate(
    (state) => chrome.storage.local.set({ requestRulesState: state, 'ui.locale': 'en' }),
    stateFor(blockRule()),
  );
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByRole('switch', { name: 'Pause all rules' }).click();
  await expect.poll(() => extensionPage.evaluate(() => chrome.action.getBadgeText({}))).toBe('Ⅱ');
  await expect
    .poll(() => extensionPage.evaluate(() => chrome.declarativeNetRequest.getDynamicRules()))
    .toEqual([]);
  await popup.close();
  await extensionPage.reload();
  await expect
    .poll(() => extensionPage.evaluate(() => chrome.action.getTitle({})))
    .toContain('All rules paused');
  const reopened = await context.newPage();
  await reopened.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(reopened.getByRole('switch', { name: 'Pause all rules' })).toBeChecked();
  await reopened.getByRole('switch', { name: 'Pause all rules' }).click();
  await expect.poll(() => extensionPage.evaluate(() => chrome.action.getBadgeText({}))).toBe('');
  await reopened.close();
  await extensionPage
    .getByRole('button', { name: 'Settings', exact: true })
    .filter({ visible: true })
    .click();
  const forth = extensionPage.getByRole('menuitem', { name: 'forth.ink' });
  await expect(forth).toHaveAttribute('href', 'https://forth.ink/');
  await expect(forth).toHaveAttribute('target', '_blank');
  await extensionPage.screenshot({ path: `${evidence}/settings.png`, animations: 'disabled' });
  await context.route('https://forth.ink/', (route) =>
    route.fulfill({ body: '<title>forth.ink link probe</title>' }),
  );
  const opened = context.waitForEvent('page');
  await forth.click();
  const destination = await opened;
  await expect(destination).toHaveURL('https://forth.ink/');
  await destination.close();
  await extensionPage.setViewportSize({ width: 390, height: 844 });
  await extensionPage
    .getByRole('button', { name: 'Settings', exact: true })
    .filter({ visible: true })
    .click();
  await expect(extensionPage.getByRole('menuitem', { name: 'forth.ink' })).toBeVisible();
  await extensionPage.screenshot({ path: `${evidence}/settings-narrow.png`, animations: 'disabled' });
  expect(await extensionPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('toolbar pause restores after a full browser restart', async () => {
  const profile = await mkdtemp(join(tmpdir(), 'requestorbit-status-restart-'));
  const target = process.env.MWR_BROWSER_TARGET === 'edge' ? 'edge' : 'chrome';
  const extensionPath = resolve(process.env.MWR_EXTENSION_PATH ?? `dist/${target}`);
  let launched = await launchChromiumExtensionContext(extensionPath, false, profile);
  try {
    let worker = await findExtensionWorker(launched.context);
    const state = stateFor(blockRule());
    state.settings.globallyPaused = true;
    await worker.evaluate(
      (value) => chrome.storage.local.set({ requestRulesState: value, 'ui.locale': 'zh-CN' }),
      state,
    );
    await expect.poll(() => worker.evaluate(() => chrome.action.getBadgeText({}))).toBe('Ⅱ');
    await launched.close();
    launched = await launchChromiumExtensionContext(extensionPath, false, profile);
    worker = await findExtensionWorker(launched.context);
    await expect.poll(() => worker.evaluate(() => chrome.action.getBadgeText({}))).toBe('Ⅱ');
    await expect
      .poll(() => worker.evaluate(() => chrome.action.getTitle({})))
      .toBe('RequestOrbit · 所有规则已暂停');
    expect(await worker.evaluate(() => chrome.declarativeNetRequest.getDynamicRules())).toEqual([]);
  } finally {
    await launched.close();
    await rm(profile, { recursive: true, force: true });
  }
});
