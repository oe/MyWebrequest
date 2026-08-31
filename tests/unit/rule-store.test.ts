import { afterEach, describe, expect, it, vi } from 'vitest';

import { createEmptyState } from '@/domain/rules/fixtures';
import { subscribeToState } from '@/infrastructure/rule-store';

describe('rule store subscriptions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('publishes valid extension storage changes and removes its listener', () => {
    let storageListener:
      ((changes: Record<string, Browser.storage.StorageChange>, areaName: string) => void) | undefined;
    const removeListener = vi.fn();

    vi.stubGlobal('browser', {
      storage: {
        local: {},
        onChanged: {
          addListener: vi.fn((listener) => {
            storageListener = listener;
          }),
          removeListener,
        },
      },
    });

    const onState = vi.fn();
    const unsubscribe = subscribeToState(onState);
    const state = createEmptyState();

    storageListener?.({ requestRulesState: { newValue: state } }, 'local');
    expect(onState).toHaveBeenCalledWith(state);

    storageListener?.({ requestRulesState: { newValue: { invalid: true } } }, 'local');
    storageListener?.({ requestRulesState: { newValue: state } }, 'sync');
    expect(onState).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(removeListener).toHaveBeenCalledWith(storageListener);
  });
});
