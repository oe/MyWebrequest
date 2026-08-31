import { createEmptyState, createSampleState } from '@/src/domain/rules/fixtures';
import type { StoredState } from '@/src/domain/rules/model';
import { storedStateSchema } from '@/src/domain/rules/schema';

const STORAGE_KEY = 'requestRulesState';
const PREVIEW_KEY = 'request-rules-preview-state';

function hasExtensionStorage(): boolean {
  return typeof browser !== 'undefined' && Boolean(browser.storage?.local);
}

export async function loadState(): Promise<StoredState> {
  let candidate: unknown;

  if (hasExtensionStorage()) {
    const result = await browser.storage.local.get(STORAGE_KEY);
    candidate = result[STORAGE_KEY];
  } else {
    const raw = globalThis.localStorage?.getItem(PREVIEW_KEY);
    candidate = raw ? JSON.parse(raw) : undefined;
  }

  const parsed = storedStateSchema.safeParse(candidate);
  if (parsed.success) return parsed.data as StoredState;

  return import.meta.env.DEV ? createSampleState() : createEmptyState();
}

export async function saveState(state: StoredState): Promise<void> {
  const parsed = storedStateSchema.parse(state);
  if (hasExtensionStorage()) {
    await browser.storage.local.set({ [STORAGE_KEY]: parsed });
    return;
  }
  globalThis.localStorage?.setItem(PREVIEW_KEY, JSON.stringify(parsed));
}
