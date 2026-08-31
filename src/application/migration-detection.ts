import { createPendingMigration, type StoredMigration } from '@/application/migration-apply';
import { createMigrationBundle } from '@/application/migration-service';
import { readLegacyLocalStorage } from '@/infrastructure/legacy-local-storage';
import { loadStoredMigration, saveStoredMigration } from '@/infrastructure/migration-store';

export type LegacyMigrationDetection =
  | { kind: 'none' }
  | { kind: 'staged'; migration: StoredMigration }
  | { kind: 'existing'; migration: StoredMigration }
  | { kind: 'source-changed'; migration: StoredMigration; detectedFingerprint: string };

export async function detectAndStageLegacyMigration(
  storage: Storage | undefined = globalThis.localStorage,
  stagedAt = new Date().toISOString(),
): Promise<LegacyMigrationDetection> {
  const existing = await loadStoredMigration();
  const legacySource = readLegacyLocalStorage(storage);
  if (Object.keys(legacySource).length === 0) {
    return existing ? { kind: 'existing', migration: existing } : { kind: 'none' };
  }

  const bundle = await createMigrationBundle(legacySource, 'legacy-local-storage', stagedAt);
  if (existing) {
    return existing.bundle.report.sourceFingerprint === bundle.report.sourceFingerprint
      ? { kind: 'existing', migration: existing }
      : {
          kind: 'source-changed',
          migration: existing,
          detectedFingerprint: bundle.report.sourceFingerprint,
        };
  }

  const migration = createPendingMigration(bundle, stagedAt);
  await saveStoredMigration(migration);
  return { kind: 'staged', migration };
}
