/// <reference types="chrome" />
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createEmptyState, sampleRules } from '@/domain/rules/fixtures';
import type { StoredState } from '@/domain/rules/model';
import { expect, test, findExtensionWorker, launchChromiumExtensionContext } from './extension.fixture';

function stateWithRules(count: number): StoredState {
  const state = createEmptyState();
  for (let index = 0; index < count; index++) {
    const rule = {
      ...sampleRules[1]!,
      id: `performance-${index}`,
      dnrId: 20000 + index,
      name: `Performance rule ${index}`,
      condition: { url: { kind: 'url-filter' as const, value: `||blocked-${index}.example^` } },
    };
    state.rules[rule.id] = rule;
    state.order.push(rule.id);
  }
  return state;
}

test('opening UI and changing language do not rewrite DNR; one pause makes one update', async ({
  context,
  extensionId,
  extensionPage,
}) => {
  const worker = await findExtensionWorker(context, extensionId);
  await extensionPage.evaluate(
    (state) => chrome.storage.local.set({ requestRulesState: state, 'ui.locale': 'en' }),
    stateWithRules(100),
  );
  await expect
    .poll(() => worker.evaluate(async () => (await chrome.declarativeNetRequest.getDynamicRules()).length))
    .toBe(100);
  // Wait for initial reconciliation/toolbar completion before counting writes.
  await extensionPage.evaluate(() =>
    chrome.runtime.sendMessage({ type: 'requestorbit.runtime.v1', operation: 'snapshot' }),
  );
  await worker.evaluate(() => {
    const scope = globalThis as typeof globalThis & { dnrWrites: number };
    scope.dnrWrites = 0;
    const original = chrome.declarativeNetRequest.updateDynamicRules.bind(chrome.declarativeNetRequest);
    chrome.declarativeNetRequest.updateDynamicRules = async (options) => {
      scope.dnrWrites++;
      return original(options);
    };
  });
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(popup.getByRole('switch', { name: 'Pause all rules' })).toBeVisible();
  await extensionPage.evaluate(() => chrome.storage.local.set({ 'ui.locale': 'zh-CN' }));
  await extensionPage.evaluate(() =>
    chrome.runtime.sendMessage({ type: 'requestorbit.runtime.v1', operation: 'snapshot' }),
  );
  expect(
    await worker.evaluate(() => (globalThis as typeof globalThis & { dnrWrites: number }).dnrWrites),
  ).toBe(0);
  await extensionPage.evaluate(() => chrome.storage.local.set({ 'ui.locale': 'en' }));
  await popup.getByRole('switch', { name: 'Pause all rules' }).click();
  await expect
    .poll(() =>
      extensionPage.evaluate(
        async () =>
          ((await chrome.storage.local.get('requestRulesState')).requestRulesState as StoredState).settings
            .globallyPaused,
      ),
    )
    .toBe(true);
  await extensionPage.evaluate(() =>
    chrome.runtime.sendMessage({ type: 'requestorbit.runtime.v1', operation: 'snapshot' }),
  );
  expect(
    await worker.evaluate(() => (globalThis as typeof globalThis & { dnrWrites: number }).dnrWrites),
  ).toBe(1);
  await popup.close();
});

test('closing the popup during a delayed background save still commits the pause', async ({
  context,
  extensionId,
  extensionPage,
}) => {
  const worker = await findExtensionWorker(context, extensionId);
  await extensionPage.evaluate(
    (state) => chrome.storage.local.set({ requestRulesState: state, 'ui.locale': 'en' }),
    stateWithRules(1),
  );
  await expect
    .poll(() => worker.evaluate(async () => (await chrome.declarativeNetRequest.getDynamicRules()).length))
    .toBe(1);
  await worker.evaluate(() => {
    const original = chrome.storage.local.set.bind(chrome.storage.local);
    chrome.storage.local.set = async (values) => {
      if ('requestRulesState' in values) await new Promise((resolve) => setTimeout(resolve, 1500));
      return original(values);
    };
  });
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByRole('switch', { name: 'Pause all rules' }).click();
  await expect
    .poll(() => worker.evaluate(async () => (await chrome.declarativeNetRequest.getDynamicRules()).length))
    .toBe(0);
  await popup.close();
  await expect
    .poll(() =>
      worker.evaluate(
        async () =>
          ((await chrome.storage.local.get('requestRulesState')).requestRulesState as StoredState).settings
            .globallyPaused,
      ),
    )
    .toBe(true);
  await expect
    .poll(() =>
      worker.evaluate(
        async () => (await chrome.storage.local.get('requestOrbitPendingCommit')).requestOrbitPendingCommit,
      ),
    )
    .toBeUndefined();
});

test('a browser restart finishes a journaled rule change', async () => {
  const profile = await mkdtemp(join(tmpdir(), 'requestorbit-journal-'));
  const target = process.env.MWR_BROWSER_TARGET === 'edge' ? 'edge' : 'chrome';
  const extensionPath = resolve(process.env.MWR_EXTENSION_PATH ?? `dist/${target}`);
  let launched = await launchChromiumExtensionContext(extensionPath, false, profile);
  try {
    const worker = await findExtensionWorker(launched.context);
    const previous = stateWithRules(1);
    const next = { ...previous, settings: { globallyPaused: true } };
    await worker.evaluate(
      (state) => chrome.storage.local.set({ requestRulesState: state, 'ui.locale': 'en' }),
      previous,
    );
    await expect
      .poll(() => worker.evaluate(async () => (await chrome.declarativeNetRequest.getDynamicRules()).length))
      .toBe(1);
    // Seed the exact durable boundary that remains if a worker terminates.
    await worker.evaluate((pending) => chrome.storage.local.set({ requestOrbitPendingCommit: pending }), {
      previous,
      next,
    });
    await launched.close();
    launched = await launchChromiumExtensionContext(extensionPath, false, profile);
    const restarted = await findExtensionWorker(launched.context);
    await expect
      .poll(() =>
        restarted.evaluate(
          async () =>
            ((await chrome.storage.local.get('requestRulesState')).requestRulesState as StoredState).settings
              .globallyPaused,
        ),
      )
      .toBe(true);
    expect(await restarted.evaluate(() => chrome.declarativeNetRequest.getDynamicRules())).toEqual([]);
    await expect
      .poll(() =>
        restarted.evaluate(
          async () => (await chrome.storage.local.get('requestOrbitPendingCommit')).requestOrbitPendingCommit,
        ),
      )
      .toBeUndefined();
  } finally {
    await launched.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test('large rule lists stay bounded and keyboard navigation crosses page boundaries', async ({
  extensionPage,
}) => {
  await extensionPage.evaluate(
    (state) => chrome.storage.local.set({ requestRulesState: state, 'ui.locale': 'en' }),
    stateWithRules(4500),
  );
  await extensionPage.reload();
  const rows = extensionPage.locator('button[data-rule-select]');
  await expect(rows).toHaveCount(100);
  await rows.first().focus();
  await rows.first().press('End');
  await expect(extensionPage.locator('button[data-rule-select="performance-4499"]')).toBeFocused();
  await expect(rows).toHaveCount(100);
  await extensionPage.locator('button[data-rule-select="performance-4499"]').press('Home');
  await expect(extensionPage.locator('button[data-rule-select="performance-0"]')).toBeFocused();
  await extensionPage.getByRole('button', { name: 'Next page' }).click();
  await expect(rows.first()).toHaveAttribute('data-rule-select', 'performance-100');
  await extensionPage
    .getByRole('textbox', { name: 'Search rules' })
    .filter({ visible: true })
    .fill('Performance rule 4499');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute('data-rule-select', 'performance-4499');
  await extensionPage.setViewportSize({ width: 390, height: 844 });
  expect(await extensionPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
