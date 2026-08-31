import { normalizeLocale, type LocalePreference } from '@/ui/i18n/core';

const STORAGE_KEY = 'ui.locale';

function normalizePreference(value: unknown): LocalePreference {
  if (value === 'system') return 'system';
  if (typeof value !== 'string') return 'system';
  return normalizeLocale(value) ?? normalizeLocale(value.split('-')[0] ?? '') ?? 'system';
}

function canUseExtensionStorage(): boolean {
  return typeof browser !== 'undefined' && Boolean(browser.runtime?.id && browser.storage?.local);
}

export async function loadLocalePreference(): Promise<LocalePreference> {
  if (canUseExtensionStorage()) {
    const stored = await browser.storage.local.get(STORAGE_KEY);
    return normalizePreference(stored[STORAGE_KEY]);
  }
  return normalizePreference(globalThis.localStorage?.getItem(STORAGE_KEY));
}

export async function saveLocalePreference(preference: LocalePreference): Promise<void> {
  if (canUseExtensionStorage()) {
    await browser.storage.local.set({ [STORAGE_KEY]: preference });
    return;
  }
  globalThis.localStorage?.setItem(STORAGE_KEY, preference);
}

export function subscribeToLocalePreference(listener: (preference: LocalePreference) => void): () => void {
  if (!canUseExtensionStorage()) return () => undefined;
  const handleChange = (changes: Record<string, Browser.storage.StorageChange>, areaName: string) => {
    if (areaName === 'local' && changes[STORAGE_KEY]) {
      listener(normalizePreference(changes[STORAGE_KEY].newValue));
    }
  };
  browser.storage.onChanged.addListener(handleChange);
  return () => browser.storage.onChanged.removeListener(handleChange);
}
