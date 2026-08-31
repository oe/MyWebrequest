import { createReconciliationScheduler } from '@/application/reconciliation-scheduler';
import { reconcileDynamicRules } from '@/infrastructure/rule-runtime';
import { loadState, RULES_STORAGE_KEY } from '@/infrastructure/rule-store';

async function reconcile(): Promise<void> {
  const state = await loadState();
  await reconcileDynamicRules(state);
}

const scheduler = createReconciliationScheduler(reconcile, (error) => {
  console.error('Rule reconciliation failed.', error);
});

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(scheduler.schedule);
  browser.runtime.onStartup.addListener(scheduler.schedule);

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[RULES_STORAGE_KEY]) scheduler.schedule();
  });

  browser.permissions.onAdded.addListener(scheduler.schedule);
  browser.permissions.onRemoved.addListener(scheduler.schedule);

  scheduler.schedule();
});
