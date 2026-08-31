import type { JsonValue } from './model';

function canonicalize(value: JsonValue): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key] ?? null)}`)
    .join(',')}}`;
}

export function canonicalLegacySource(rawSnapshot: Record<string, JsonValue>): string {
  return canonicalize(rawSnapshot);
}

export async function fingerprintLegacySource(rawSnapshot: Record<string, JsonValue>): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalLegacySource(rawSnapshot));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
