type SyncStorageArea = {
  get(keys: null): Promise<Record<string, unknown>>;
};

const COLLECTION_KEYS = new Set([
  'block',
  'hsts',
  'hotlink',
  'log',
  'custom',
  'cors',
  'contextmenu',
  'ua',
  'ua-list',
  'gsearch',
  'gstatic',
]);
const OBJECT_KEYS = new Set(['onoff', 'config']);
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseLocalValue(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function collectionItems(key: string, value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (key === 'custom' && isRecord(value))
    return Object.keys(value)
      .sort()
      .map((item) => value[item]);
  return null;
}

function itemIdentity(item: unknown): string {
  if (typeof item === 'string') return `url:${item}`;
  if (isRecord(item) && typeof item.url === 'string') return `url:${item.url}`;
  if (isRecord(item) && typeof item.matchUrl === 'string') return `match:${item.matchUrl}`;
  return `json:${JSON.stringify(item)}`;
}

function mergeCollections(key: string, primary: unknown, secondary: unknown): unknown[] | null {
  const primaryItems = collectionItems(key, primary);
  const secondaryItems = collectionItems(key, secondary);
  if (!primaryItems || !secondaryItems) return null;

  const merged = [...primaryItems];
  const identities = new Set(primaryItems.map(itemIdentity));
  for (const item of secondaryItems) {
    const identity = itemIdentity(item);
    if (identities.has(identity)) continue;
    identities.add(identity);
    merged.push(item);
  }
  return merged;
}

function equivalent(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function mergeLegacyChromeSources(
  syncSource: Record<string, unknown>,
  localSource: Record<string, string>,
): Record<string, unknown> {
  if (Object.keys(syncSource).length === 0) return localSource;

  const merged: Record<string, unknown> = Object.create(null);
  for (const key of Object.keys(syncSource).sort()) merged[key] = syncSource[key];

  for (const key of Object.keys(localSource).sort()) {
    const localValue = parseLocalValue(localSource[key] ?? '');
    if (!(key in merged)) {
      merged[key] = localValue;
      continue;
    }
    if (equivalent(merged[key], localValue)) continue;

    if (COLLECTION_KEYS.has(key)) {
      const collection = mergeCollections(key, merged[key], localValue);
      if (collection) {
        merged[key] = collection;
        continue;
      }
    }
    if (OBJECT_KEYS.has(key) && isRecord(merged[key]) && isRecord(localValue)) {
      const conflicts = Object.fromEntries(
        Object.entries(localValue).filter(
          ([property, value]) =>
            property in (merged[key] as Record<string, unknown>) &&
            !equivalent((merged[key] as Record<string, unknown>)[property], value),
        ),
      );
      merged[key] = { ...localValue, ...(merged[key] as Record<string, unknown>) };
      if (Object.keys(conflicts).length > 0) merged[`legacy-local-storage-conflict:${key}`] = conflicts;
      continue;
    }

    merged[`legacy-local-storage-conflict:${key}`] = localValue;
  }

  return merged;
}

export async function readLegacyChromeSyncStorage(
  storageArea: SyncStorageArea | undefined = typeof browser === 'undefined'
    ? undefined
    : (browser.storage?.sync as SyncStorageArea | undefined),
): Promise<Record<string, unknown>> {
  if (!storageArea) return Object.create(null) as Record<string, unknown>;
  const source = await storageArea.get(null);
  return isRecord(source) ? source : (Object.create(null) as Record<string, unknown>);
}
