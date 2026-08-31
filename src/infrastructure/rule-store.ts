import { createEmptyState, createSampleState } from '@/domain/rules/fixtures';
import type { StoredState } from '@/domain/rules/model';
import { storedStateSchema } from '@/domain/rules/schema';

export const RULES_STORAGE_KEY = 'requestRulesState';
const PREVIEW_KEY = 'request-rules-preview-state';

type StateListener = (state: StoredState) => void;

function hasExtensionStorage(): boolean {
  return typeof browser !== 'undefined' && Boolean(browser.storage?.local);
}

function parseState(candidate: unknown): StoredState | null {
  const parsed = storedStateSchema.safeParse(candidate);
  return parsed.success ? (parsed.data as StoredState) : null;
}

function parseSerializedState(serialized: string | null): StoredState | null {
  if (!serialized) return null;
  try {
    return parseState(JSON.parse(serialized));
  } catch {
    return null;
  }
}

export async function loadState(): Promise<StoredState> {
  let candidate: unknown;

  if (hasExtensionStorage()) {
    const result = await browser.storage.local.get(RULES_STORAGE_KEY);
    candidate = result[RULES_STORAGE_KEY];
  } else {
    const raw = globalThis.localStorage?.getItem(PREVIEW_KEY);
    candidate = raw ? JSON.parse(raw) : undefined;
  }

  const parsed = parseState(candidate);
  if (parsed) return parsed;

  return import.meta.env.DEV ? createSampleState() : createEmptyState();
}

export async function saveState(state: StoredState): Promise<void> {
  const parsed = storedStateSchema.parse(state);
  if (hasExtensionStorage()) {
    await browser.storage.local.set({ [RULES_STORAGE_KEY]: parsed });
    return;
  }
  globalThis.localStorage?.setItem(PREVIEW_KEY, JSON.stringify(parsed));
}

export function subscribeToState(listener: StateListener): () => void {
  if (hasExtensionStorage()) {
    const handleChange = (changes: Record<string, Browser.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'local') return;
      const nextState = parseState(changes[RULES_STORAGE_KEY]?.newValue);
      if (nextState) listener(nextState);
    };

    browser.storage.onChanged.addListener(handleChange);
    return () => browser.storage.onChanged.removeListener(handleChange);
  }

  if (typeof window === 'undefined') return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== PREVIEW_KEY) return;
    const nextState = parseSerializedState(event.newValue);
    if (nextState) listener(nextState);
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}
