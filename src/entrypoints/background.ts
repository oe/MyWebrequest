import { updateActionState } from '@/infrastructure/action-state';
import { supportsLegacyMigration } from '@/infrastructure/browser-capabilities';
import { createReconciliationScheduler } from '@/application/reconciliation-scheduler';
import { reconcileDynamicRules } from '@/infrastructure/rule-runtime';
import { loadState, RULES_STORAGE_KEY } from '@/infrastructure/rule-store';

async function reconcile(): Promise<void> {
  const state = await loadState().catch(async (error: unknown) => {
    await updateActionState('error');
    throw error;
  });
  await reconcileDynamicRules(state);
}

const scheduler = createReconciliationScheduler(reconcile, (error) => {
  console.error('Rule reconciliation failed.', error);
});

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener((details) => {
    scheduler.schedule();
    if (
      supportsLegacyMigration() &&
      details.reason === 'update' &&
      details.previousVersion?.startsWith('0.')
    ) {
      void browser.storage.local.set({ requestOrbitLegacyUpgrade: true }).catch((error: unknown) => {
        console.error('Could not record legacy upgrade.', error);
      });
    }
  });
  browser.runtime.onStartup.addListener(scheduler.schedule);

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes[RULES_STORAGE_KEY] || changes['ui.locale'])) scheduler.schedule();
  });

  browser.permissions.onAdded.addListener(scheduler.schedule);
  browser.permissions.onRemoved.addListener(scheduler.schedule);

  scheduler.schedule();
});
