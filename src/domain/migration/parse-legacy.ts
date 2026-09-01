import {
  LEGACY_KEYS,
  type JsonValue,
  type LegacyParseIssue,
  type LegacySourceEntry,
  type MigrationSource,
  type ParsedLegacySource,
} from './model';

const ARRAY_KEYS = new Set([
  'block',
  'hsts',
  'hotlink',
  'log',
  'gsearch',
  'gstatic',
  'cors',
  'contextmenu',
  'ua',
  'ua-list',
]);
const OBJECT_KEYS = new Set(['onoff', 'config']);
const MAX_KEYS = 100;
const MAX_KEY_BYTES = 1024 * 1024;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024;
const MAX_ITEMS = 10_000;
const MAX_DEPTH = 12;
const MAX_STRING_LENGTH = 10_000;
const textEncoder = new TextEncoder();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateJsonValue(value: unknown, depth = 0): value is JsonValue {
  if (depth > MAX_DEPTH) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.length <= MAX_STRING_LENGTH;
  if (Array.isArray(value))
    return value.length <= MAX_ITEMS && value.every((item) => validateJsonValue(item, depth + 1));
  if (!isRecord(value) || Object.keys(value).length > MAX_ITEMS) return false;
  return Object.entries(value).every(
    ([key, item]) => key.length <= MAX_STRING_LENGTH && validateJsonValue(item, depth + 1),
  );
}

function rawValue(value: unknown, typedSource = false): string | null {
  if (typeof value === 'string' && !typedSource) return value;
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? null : serialized;
  } catch {
    return null;
  }
}

function parseStoredValue(key: string, value: unknown): { ok: true; value: unknown } | { ok: false } {
  if (typeof value !== 'string') return { ok: true, value };
  if (!(LEGACY_KEYS as readonly string[]).includes(key)) return { ok: true, value };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false };
  }
}

function addEntries(
  key: string,
  value: JsonValue,
  entries: LegacySourceEntry[],
  issues: LegacyParseIssue[],
): void {
  if (key === 'custom') {
    if (Array.isArray(value)) {
      value.forEach((item, index) => entries.push({ key, locator: `${key}[${index}]`, value: item }));
      return;
    }
    if (!isRecord(value)) {
      issues.push({ key, locator: key, code: 'invalid-shape', message: 'Expected an array or object.' });
      return;
    }
    Object.keys(value)
      .sort()
      .forEach((property) => {
        const item = value[property];
        if (validateJsonValue(item)) entries.push({ key, locator: `${key}.${property}`, value: item });
      });
    return;
  }

  if (ARRAY_KEYS.has(key)) {
    if (!Array.isArray(value)) {
      issues.push({ key, locator: key, code: 'invalid-shape', message: 'Expected an array.' });
      return;
    }
    value.forEach((item, index) => entries.push({ key, locator: `${key}[${index}]`, value: item }));
    return;
  }

  if (OBJECT_KEYS.has(key)) {
    if (!isRecord(value)) {
      issues.push({ key, locator: key, code: 'invalid-shape', message: 'Expected an object.' });
      return;
    }
    Object.keys(value)
      .sort()
      .forEach((property) => {
        const item = value[property];
        if (validateJsonValue(item)) {
          entries.push({ key, locator: `${key}.${property}`, value: item });
        }
      });
    return;
  }

  entries.push({ key, locator: key, value });
}

export function parseLegacySource(
  input: Record<string, unknown>,
  source: MigrationSource,
): ParsedLegacySource {
  const rawSnapshot = Object.create(null) as Record<string, string>;
  const fingerprintMaterial = Object.create(null) as Record<string, JsonValue>;
  const entries: LegacySourceEntry[] = [];
  const issues: LegacyParseIssue[] = [];
  let totalBytes = 0;
  const keys = Object.keys(input).sort();
  const typedSource = source === 'legacy-chrome-storage';

  for (const key of keys) {
    const raw = rawValue(input[key], typedSource);
    if (raw === null) {
      fingerprintMaterial[key] = { $invalid: 'not-json-compatible' };
      continue;
    }
    const parsed = typedSource ? { ok: true as const, value: input[key] } : parseStoredValue(key, input[key]);
    fingerprintMaterial[key] = parsed.ok && validateJsonValue(parsed.value) ? parsed.value : { $raw: raw };
  }

  if (keys.length > MAX_KEYS) {
    issues.push({
      key: '$source',
      locator: '$source',
      code: 'limit-exceeded',
      message: `The source contains more than ${MAX_KEYS} keys.`,
    });
    for (const key of keys.slice(MAX_KEYS)) {
      const raw = rawValue(input[key], typedSource);
      issues.push({
        key,
        locator: key,
        code: 'limit-exceeded',
        message: 'The key is outside the bounded migration key limit.',
        ...(raw === null ? {} : { byteLength: textEncoder.encode(raw).byteLength }),
      });
    }
  }

  for (const key of keys.slice(0, MAX_KEYS)) {
    const raw = rawValue(input[key], typedSource);
    if (raw === null) {
      issues.push({ key, locator: key, code: 'invalid-shape', message: 'The value is not JSON-compatible.' });
      continue;
    }

    const byteLength = textEncoder.encode(raw).byteLength;
    totalBytes += byteLength;
    if (byteLength > MAX_KEY_BYTES || totalBytes > MAX_TOTAL_BYTES) {
      issues.push({
        key,
        locator: key,
        code: 'limit-exceeded',
        message: 'The value exceeds the bounded migration snapshot limits.',
        byteLength,
      });
      continue;
    }
    rawSnapshot[key] = raw;

    const parsed = typedSource ? { ok: true as const, value: input[key] } : parseStoredValue(key, input[key]);
    if (!parsed.ok) {
      issues.push({ key, locator: key, code: 'invalid-json', message: 'The stored JSON is invalid.' });
      continue;
    }
    if (!validateJsonValue(parsed.value)) {
      issues.push({
        key,
        locator: key,
        code: 'limit-exceeded',
        message: 'The parsed value exceeds nesting, item, or string limits.',
        byteLength,
      });
      continue;
    }
    addEntries(key, parsed.value, entries, issues);
  }

  return { source, rawSnapshot, fingerprintMaterial, entries, issues };
}
