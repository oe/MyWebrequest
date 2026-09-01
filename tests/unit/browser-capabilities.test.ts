import { describe, expect, it } from 'vitest';

import { supportsLegacyMigration } from '@/infrastructure/browser-capabilities';

describe('browser capabilities', () => {
  it('offers legacy migration only to the browser that had a legacy release', () => {
    expect(supportsLegacyMigration('chrome')).toBe(true);
    expect(supportsLegacyMigration('edge')).toBe(false);
    expect(supportsLegacyMigration('firefox')).toBe(false);
  });

  it('defaults unknown future targets to migration unavailable', () => {
    expect(supportsLegacyMigration('safari')).toBe(false);
  });
});
