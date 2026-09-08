import { afterEach, describe, expect, it, vi } from 'vitest';
import { reconcileDynamicRules } from '@/infrastructure/rule-runtime';
import { createEmptyState } from '@/domain/rules/fixtures';
vi.mock('@/infrastructure/ui-preferences', () => ({ loadLocalePreference: async () => 'zh-CN' }));

function runtime(update: () => Promise<void>) {
  const action = {
    setIcon: vi.fn(async () => {}),
    setBadgeText: vi.fn(async () => {}),
    setBadgeBackgroundColor: vi.fn(async () => {}),
    setBadgeTextColor: vi.fn(async () => {}),
    setTitle: vi.fn(async () => {}),
  };
  vi.stubGlobal('browser', {
    action,
    permissions: {},
    declarativeNetRequest: { getDynamicRules: async () => [], updateDynamicRules: update },
  });
  return action;
}
afterEach(() => vi.unstubAllGlobals());

describe('toolbar runtime status', () => {
  it('only confirms pause after the browser applies it and clears it after resume', async () => {
    let complete!: () => void;
    const pending = new Promise<void>((resolve) => {
      complete = resolve;
    });
    const action = runtime(() => pending);
    const state = createEmptyState();
    state.settings.globallyPaused = true;
    const applied = reconcileDynamicRules(state);
    await Promise.resolve();
    expect(action.setBadgeText).not.toHaveBeenCalled();
    complete();
    await applied;
    expect(action.setIcon).toHaveBeenLastCalledWith({
      path: { 16: 'icon/paused-16.png', 32: 'icon/paused-32.png', 48: 'icon/paused-48.png' },
    });
    expect(action.setBadgeText).toHaveBeenLastCalledWith({ text: '' });
    expect(action.setTitle).toHaveBeenLastCalledWith({ title: 'RequestOrbit · 所有规则已暂停' });
    await reconcileDynamicRules(createEmptyState());
    expect(action.setIcon).toHaveBeenLastCalledWith({
      path: { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png' },
    });
    expect(action.setBadgeText).toHaveBeenLastCalledWith({ text: '' });
  });
  it('shows an error instead of falsely confirming a failed pause', async () => {
    const action = runtime(async () => {
      throw new Error('DNR failure');
    });
    const state = createEmptyState();
    state.settings.globallyPaused = true;
    await expect(reconcileDynamicRules(state)).rejects.toThrow('DNR failure');
    expect(action.setBadgeText).toHaveBeenLastCalledWith({ text: '!' });
  });
});
