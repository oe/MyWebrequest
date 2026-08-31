import { LEGACY_KEYS } from '@/domain/migration/model';

const RESERVED_NEW_KEYS = new Set(['request-rules-preview-state', 'request-rules-preview-migration']);

export function readLegacyLocalStorage(
  storage: Storage | undefined = globalThis.localStorage,
): Record<string, string> {
  const source = Object.create(null) as Record<string, string>;
  if (!storage) return source;

  const knownKeys = new Set<string>(LEGACY_KEYS);
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || RESERVED_NEW_KEYS.has(key)) continue;
    const value = storage.getItem(key);
    if (value !== null && (knownKeys.has(key) || !key.startsWith('request-rules-'))) source[key] = value;
  }
  return source;
}
