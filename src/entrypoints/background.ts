import { reconcileDynamicRules } from '@/infrastructure/rule-runtime';
import { loadState } from '@/infrastructure/rule-store';

async function reconcile(): Promise<void> {
  const state = await loadState();
  await reconcileDynamicRules(state);
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    void reconcile();
  });

  browser.runtime.onStartup.addListener(() => {
    void reconcile();
  });
});
