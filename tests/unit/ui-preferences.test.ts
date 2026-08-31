import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  loadLocalePreference,
  saveLocalePreference,
  subscribeToLocalePreference,
} from '@/infrastructure/ui-preferences';

describe('UI locale preferences', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('normalizes stored regional locale values', async () => {
    vi.stubGlobal('browser', {
      runtime: { id: 'extension-id' },
      storage: {
        local: { get: vi.fn(async () => ({ 'ui.locale': 'fr-CA' })) },
      },
    });

    await expect(loadLocalePreference()).resolves.toBe('fr');
  });

  it('persists a supported preference in extension-local storage', async () => {
    const set = vi.fn(async () => undefined);
    vi.stubGlobal('browser', {
      runtime: { id: 'extension-id' },
      storage: { local: { set } },
    });

    await saveLocalePreference('ja');
    expect(set).toHaveBeenCalledWith({ 'ui.locale': 'ja' });
  });

  it('publishes valid cross-surface changes and removes its listener', () => {
    let storageListener:
      ((changes: Record<string, Browser.storage.StorageChange>, areaName: string) => void) | undefined;
    const removeListener = vi.fn();
    vi.stubGlobal('browser', {
      runtime: { id: 'extension-id' },
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

    const listener = vi.fn();
    const unsubscribe = subscribeToLocalePreference(listener);
    storageListener?.({ 'ui.locale': { newValue: 'es-MX' } }, 'local');
    storageListener?.({ 'ui.locale': { newValue: 'de' } }, 'local');
    storageListener?.({ 'ui.locale': { newValue: 'ko' } }, 'sync');

    expect(listener).toHaveBeenNthCalledWith(1, 'es');
    expect(listener).toHaveBeenNthCalledWith(2, 'system');
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    expect(removeListener).toHaveBeenCalledWith(storageListener);
  });
});
