import type { StoredMigration } from '@/application/migration-apply';
import type { LegacyMigrationDetection } from '@/application/migration-detection';

export function shouldShowMigrationNavigation(
  detection: LegacyMigrationDetection['kind'],
  loading: boolean,
  status: StoredMigration['status'] | null,
): boolean {
  if (loading || detection === 'none') return false;
  if (detection === 'source-changed') return true;
  return status === 'pending';
}
