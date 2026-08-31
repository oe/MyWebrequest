import { reconcileDynamicRules } from '@/src/infrastructure/rule-runtime';
import { loadState } from '@/src/infrastructure/rule-store';

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
