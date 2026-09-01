import type { StoredMigration } from '@/application/migration-apply';
import type { StoredState } from '@/domain/rules/model';
import { ruleSchema, storedStateSchema } from '@/domain/rules/schema';
import { RULES_STORAGE_KEY } from '@/infrastructure/rule-store';
import { z } from 'zod/v3';

export const MIGRATION_STORAGE_KEY = 'requestRulesMigration';
const PREVIEW_MIGRATION_KEY = 'request-rules-preview-migration';
const textEncoder = new TextEncoder();

function hasExtensionStorage(): boolean {
  return typeof browser !== 'undefined' && Boolean(browser.storage?.local);
}

const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number().finite(),
    z.string(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

const migrationItemSchema = z.object({
  id: z.string().min(1).max(128),
  sourceKey: z.string().max(10_000),
  sourceLocator: z.string().max(10_000),
  sourceValue: jsonValueSchema.nullable(),
  sourceByteLength: z.number().int().nonnegative().optional(),
  outcome: z.enum(['automatic', 'review-required', 'unsupported', 'removed-feature', 'invalid']),
  reasonCode: z.string().min(1).max(200),
  explanation: z.string().min(1).max(10_000),
  enabledIntent: z.boolean(),
  candidateRule: ruleSchema.optional(),
});

const storedMigrationSchema = z
  .object({
    migrationVersion: z.literal(1),
    status: z.enum(['pending', 'applied', 'rolled-back']),
    bundle: z.object({
      report: z.object({
        migrationVersion: z.literal(1),
        source: z.enum(['legacy-local-storage', 'legacy-chrome-storage', 'legacy-json-import']),
        sourceFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
        createdAt: z.string().datetime(),
        items: z.array(migrationItemSchema).max(10_101),
        summary: z.object({
          automatic: z.number().int().nonnegative(),
          reviewRequired: z.number().int().nonnegative(),
          unsupported: z.number().int().nonnegative(),
          removedFeature: z.number().int().nonnegative(),
          invalid: z.number().int().nonnegative(),
        }),
      }),
      rawSnapshot: z.record(z.string(), z.string()),
    }),
    selectedItemIds: z.array(z.string().min(1).max(128)).max(10_000),
    stagedAt: z.string().datetime(),
    appliedAt: z.string().datetime().optional(),
    rolledBackAt: z.string().datetime().optional(),
    appliedRuleIds: z.array(z.string().min(1).max(128)).max(10_000),
    preMigrationState: storedStateSchema.optional(),
  })
  .superRefine((migration, context) => {
    const items = migration.bundle.report.items;
    const itemIds = items.map((item) => item.id);
    const knownItemIds = new Set(itemIds);
    if (knownItemIds.size !== itemIds.length) {
      context.addIssue({
        code: 'custom',
        path: ['bundle', 'report', 'items'],
        message: 'Item IDs must be unique.',
      });
    }
    const actualSummary = {
      automatic: items.filter((item) => item.outcome === 'automatic').length,
      reviewRequired: items.filter((item) => item.outcome === 'review-required').length,
      unsupported: items.filter((item) => item.outcome === 'unsupported').length,
      removedFeature: items.filter((item) => item.outcome === 'removed-feature').length,
      invalid: items.filter((item) => item.outcome === 'invalid').length,
    };
    if (JSON.stringify(actualSummary) !== JSON.stringify(migration.bundle.report.summary)) {
      context.addIssue({
        code: 'custom',
        path: ['bundle', 'report', 'summary'],
        message: 'The report summary does not match its items.',
      });
    }
    if (migration.selectedItemIds.some((id) => !knownItemIds.has(id))) {
      context.addIssue({
        code: 'custom',
        path: ['selectedItemIds'],
        message: 'Selected migration items must exist in the report.',
      });
    }
    if (new Set(migration.selectedItemIds).size !== migration.selectedItemIds.length) {
      context.addIssue({
        code: 'custom',
        path: ['selectedItemIds'],
        message: 'Selected item IDs must be unique.',
      });
    }
    if (items.some((item) => item.candidateRule && item.candidateRule.id !== item.id)) {
      context.addIssue({
        code: 'custom',
        path: ['bundle', 'report', 'items'],
        message: 'Candidate rule IDs must match their migration item IDs.',
      });
    }
    const rawBytes = Object.values(migration.bundle.rawSnapshot).reduce(
      (total, value) => total + textEncoder.encode(value).byteLength,
      0,
    );
    if (Object.keys(migration.bundle.rawSnapshot).length > 100 || rawBytes > 5 * 1024 * 1024) {
      context.addIssue({
        code: 'custom',
        path: ['bundle', 'rawSnapshot'],
        message: 'The raw migration snapshot exceeds its storage bounds.',
      });
    }
    if (migration.status === 'pending' && (migration.appliedAt || migration.preMigrationState)) {
      context.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'A pending migration cannot contain applied-state fields.',
      });
    }
    if (migration.status !== 'pending' && (!migration.appliedAt || !migration.preMigrationState)) {
      context.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'Applied migrations require an application timestamp and recovery snapshot.',
      });
    }
    if (migration.status === 'rolled-back' && !migration.rolledBackAt) {
      context.addIssue({
        code: 'custom',
        path: ['rolledBackAt'],
        message: 'Rolled-back migrations require a rollback timestamp.',
      });
    }
  });

export async function loadStoredMigration(): Promise<StoredMigration | null> {
  let candidate: unknown;
  if (hasExtensionStorage()) {
    const result = await browser.storage.local.get(MIGRATION_STORAGE_KEY);
    candidate = result[MIGRATION_STORAGE_KEY];
  } else {
    const raw = globalThis.localStorage?.getItem(PREVIEW_MIGRATION_KEY);
    if (raw) {
      try {
        candidate = JSON.parse(raw);
      } catch {
        return null;
      }
    }
  }
  const parsed = storedMigrationSchema.safeParse(candidate);
  return parsed.success ? (parsed.data as StoredMigration) : null;
}

export async function saveStoredMigration(migration: StoredMigration): Promise<void> {
  const parsedMigration = storedMigrationSchema.parse(migration) as StoredMigration;
  if (hasExtensionStorage()) {
    await browser.storage.local.set({ [MIGRATION_STORAGE_KEY]: parsedMigration });
    return;
  }
  globalThis.localStorage?.setItem(PREVIEW_MIGRATION_KEY, JSON.stringify(parsedMigration));
}

export async function commitStateAndMigration(state: StoredState, migration: StoredMigration): Promise<void> {
  const parsedState = storedStateSchema.parse(state);
  const parsedMigration = storedMigrationSchema.parse(migration) as StoredMigration;
  if (hasExtensionStorage()) {
    await browser.storage.local.set({
      [RULES_STORAGE_KEY]: parsedState,
      [MIGRATION_STORAGE_KEY]: parsedMigration,
    });
    return;
  }
  globalThis.localStorage?.setItem('request-rules-preview-state', JSON.stringify(parsedState));
  globalThis.localStorage?.setItem(PREVIEW_MIGRATION_KEY, JSON.stringify(parsedMigration));
}
