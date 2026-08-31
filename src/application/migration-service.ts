import { classifyLegacySource } from '@/domain/migration/classify';
import { fingerprintLegacySource } from '@/domain/migration/fingerprint';
import type { MigrationBundle, MigrationOutcome, MigrationSource } from '@/domain/migration/model';
import { parseLegacySource } from '@/domain/migration/parse-legacy';

function count(items: MigrationOutcome[], outcome: MigrationOutcome): number {
  return items.filter((item) => item === outcome).length;
}

export async function createMigrationBundle(
  input: Record<string, unknown>,
  source: MigrationSource,
  now = new Date().toISOString(),
): Promise<MigrationBundle> {
  const parsed = parseLegacySource(input, source);
  const [sourceFingerprint, items] = await Promise.all([
    fingerprintLegacySource(parsed.fingerprintMaterial),
    Promise.resolve(classifyLegacySource(parsed, now)),
  ]);
  const outcomes = items.map((item) => item.outcome);

  return {
    report: {
      migrationVersion: 1,
      source,
      sourceFingerprint,
      createdAt: now,
      items,
      summary: {
        automatic: count(outcomes, 'automatic'),
        reviewRequired: count(outcomes, 'review-required'),
        unsupported: count(outcomes, 'unsupported'),
        removedFeature: count(outcomes, 'removed-feature'),
        invalid: count(outcomes, 'invalid'),
      },
    },
    rawSnapshot: parsed.rawSnapshot,
  };
}
