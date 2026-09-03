import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  loadThemePreference,
  saveThemePreference,
  subscribeToThemePreference,
} from '@/infrastructure/theme-preferences';
import { normalizeThemePreference, resolveTheme } from '@/ui/theme/core';

describe('UI theme preferences', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('normalizes unknown values and resolves the system preference', () => {
    expect(normalizeThemePreference('dark')).toBe('dark');
    expect(normalizeThemePreference('sepia')).toBe('system');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
  });

  it('loads and persists a supported preference in extension-local storage', async () => {
    const set = vi.fn(async () => undefined);
    vi.stubGlobal('browser', {
      runtime: { id: 'extension-id' },
      storage: {
        local: {
          get: vi.fn(async () => ({ 'ui.theme': 'dark' })),
          set,
        },
      },
    });

    await expect(loadThemePreference()).resolves.toBe('dark');
    await saveThemePreference('light');
    expect(set).toHaveBeenCalledWith({ 'ui.theme': 'light' });
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
    const unsubscribe = subscribeToThemePreference(listener);
    storageListener?.({ 'ui.theme': { newValue: 'dark' } }, 'local');
    storageListener?.({ 'ui.theme': { newValue: 'sepia' } }, 'local');
    storageListener?.({ 'ui.theme': { newValue: 'light' } }, 'sync');

    expect(listener).toHaveBeenNthCalledWith(1, 'dark');
    expect(listener).toHaveBeenNthCalledWith(2, 'system');
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    expect(removeListener).toHaveBeenCalledWith(storageListener);
  });
});
