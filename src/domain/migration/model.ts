import type { Rule } from '@/domain/rules/model';

export const LEGACY_KEYS = [
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
  'onoff',
  'config',
  'version',
] as const;

export type LegacyKey = (typeof LEGACY_KEYS)[number];
export type MigrationSource = 'legacy-local-storage' | 'legacy-chrome-storage' | 'legacy-json-import';
export type MigrationOutcome =
  'automatic' | 'review-required' | 'unsupported' | 'removed-feature' | 'invalid';

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type LegacySourceEntry = {
  key: string;
  locator: string;
  value: JsonValue;
};

export type LegacyParseIssue = {
  key: string;
  locator: string;
  code: 'invalid-json' | 'invalid-shape' | 'limit-exceeded';
  message: string;
  byteLength?: number;
};

export type ParsedLegacySource = {
  source: MigrationSource;
  rawSnapshot: Record<string, string>;
  fingerprintMaterial: Record<string, JsonValue>;
  entries: LegacySourceEntry[];
  issues: LegacyParseIssue[];
};

export type MigrationItem = {
  id: string;
  sourceKey: string;
  sourceLocator: string;
  sourceValue: JsonValue | null;
  sourceByteLength?: number;
  outcome: MigrationOutcome;
  reasonCode: string;
  explanation: string;
  enabledIntent: boolean;
  candidateRule?: Rule;
};

export type MigrationReport = {
  migrationVersion: 1;
  source: MigrationSource;
  sourceFingerprint: string;
  createdAt: string;
  items: MigrationItem[];
  summary: Record<'automatic' | 'reviewRequired' | 'unsupported' | 'removedFeature' | 'invalid', number>;
};

export type MigrationBundle = {
  report: MigrationReport;
  rawSnapshot: Record<string, string>;
};
