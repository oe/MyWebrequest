import { normalizeThemePreference, type ThemePreference } from '@/ui/theme/core';

const STORAGE_KEY = 'ui.theme';

function canUseExtensionStorage(): boolean {
  return typeof browser !== 'undefined' && Boolean(browser.runtime?.id && browser.storage?.local);
}

export async function loadThemePreference(): Promise<ThemePreference> {
  if (canUseExtensionStorage()) {
    const stored = await browser.storage.local.get(STORAGE_KEY);
    return normalizeThemePreference(stored[STORAGE_KEY]);
  }
  return normalizeThemePreference(globalThis.localStorage?.getItem(STORAGE_KEY));
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  if (canUseExtensionStorage()) {
    await browser.storage.local.set({ [STORAGE_KEY]: preference });
    return;
  }
  globalThis.localStorage?.setItem(STORAGE_KEY, preference);
}

export function subscribeToThemePreference(listener: (preference: ThemePreference) => void): () => void {
  if (!canUseExtensionStorage()) return () => undefined;
  const handleChange = (changes: Record<string, Browser.storage.StorageChange>, areaName: string) => {
    if (areaName === 'local' && changes[STORAGE_KEY]) {
      listener(normalizeThemePreference(changes[STORAGE_KEY].newValue));
    }
  };
  browser.storage.onChanged.addListener(handleChange);
  return () => browser.storage.onChanged.removeListener(handleChange);
}
