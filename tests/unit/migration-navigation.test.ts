import { describe, expect, it } from 'vitest';

import { shouldShowMigrationNavigation } from '@/ui/migration/migration-navigation';

describe('shouldShowMigrationNavigation', () => {
  it('keeps migration out of primary navigation when no legacy data exists', () => {
    expect(shouldShowMigrationNavigation('none', false)).toBe(false);
  });

  it.each(['staged', 'existing', 'source-changed'] as const)(
    'shows actionable migration state %s in primary navigation',
    (detection) => {
      expect(shouldShowMigrationNavigation(detection, false)).toBe(true);
    },
  );

  it('does not flash the migration entry while detection is loading', () => {
    expect(shouldShowMigrationNavigation('staged', true)).toBe(false);
  });
});
