import { reconcileDynamicRules } from '@/infrastructure/rule-runtime';
import { loadState, RULES_STORAGE_KEY } from '@/infrastructure/rule-store';

async function reconcile(): Promise<void> {
  const state = await loadState();
  await reconcileDynamicRules(state);
}

let reconciliation = Promise.resolve();

function scheduleReconcile(): void {
  reconciliation = reconciliation.then(reconcile).catch((error: unknown) => {
    console.error('Rule reconciliation failed.', error);
  });
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(scheduleReconcile);
  browser.runtime.onStartup.addListener(scheduleReconcile);

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[RULES_STORAGE_KEY]) scheduleReconcile();
  });

  browser.permissions.onAdded.addListener(scheduleReconcile);
  browser.permissions.onRemoved.addListener(scheduleReconcile);

  scheduleReconcile();
});
