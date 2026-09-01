import { describe, expect, it } from 'vitest';

import { shouldShowMigrationNavigation } from '@/ui/migration/migration-navigation';

describe('shouldShowMigrationNavigation', () => {
  it('keeps migration out of primary navigation when no legacy data exists', () => {
    expect(shouldShowMigrationNavigation('none', false, null)).toBe(false);
  });

  it.each(['staged', 'existing'] as const)('shows pending migration state %s', (detection) => {
    expect(shouldShowMigrationNavigation(detection, false, 'pending')).toBe(true);
  });

  it('shows a newly detected source that differs from the stored migration', () => {
    expect(shouldShowMigrationNavigation('source-changed', false, 'applied')).toBe(true);
  });

  it.each(['applied', 'rolled-back'] as const)(
    'keeps completed migration state %s in Settings only',
    (status) => {
      expect(shouldShowMigrationNavigation('existing', false, status)).toBe(false);
    },
  );

  it('does not flash the migration entry while detection is loading', () => {
    expect(shouldShowMigrationNavigation('staged', true, 'pending')).toBe(false);
  });
});
