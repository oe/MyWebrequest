import type { LegacyMigrationDetection } from '@/application/migration-detection';

export function shouldShowMigrationNavigation(
  detection: LegacyMigrationDetection['kind'],
  loading: boolean,
): boolean {
  return !loading && detection !== 'none';
}
