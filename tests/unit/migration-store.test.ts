import { afterEach, describe, expect, it, vi } from 'vitest';

import { createPendingMigration } from '@/application/migration-apply';
import { createMigrationBundle } from '@/application/migration-service';
import { createEmptyState } from '@/domain/rules/fixtures';
import {
  commitStateAndMigration,
  loadStoredMigration,
  MIGRATION_STORAGE_KEY,
} from '@/infrastructure/migration-store';

import fixture from '../fixtures/legacy-installation.json';

describe('migration storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('commits canonical state and a validated migration record in one extension storage write', async () => {
    const set = vi.fn(async () => undefined);
    vi.stubGlobal('browser', { storage: { local: { set } } });
    const bundle = await createMigrationBundle(fixture, 'legacy-json-import', '2026-08-31T01:00:00.000Z');
    const migration = createPendingMigration(bundle, '2026-08-31T01:00:00.000Z');
    const state = createEmptyState();

    await commitStateAndMigration(state, migration);

    expect(set).toHaveBeenCalledWith({
      requestRulesState: state,
      [MIGRATION_STORAGE_KEY]: migration,
    });
  });

  it('rejects a corrupt persisted migration record', async () => {
    vi.stubGlobal('browser', {
      storage: { local: { get: vi.fn(async () => ({ [MIGRATION_STORAGE_KEY]: { migrationVersion: 1 } })) } },
    });

    await expect(loadStoredMigration()).resolves.toBeNull();
  });

  it('rejects a report whose summary does not match its items', async () => {
    const bundle = await createMigrationBundle(fixture, 'legacy-json-import', '2026-08-31T01:00:00.000Z');
    const migration = createPendingMigration(bundle, '2026-08-31T01:00:00.000Z');
    migration.bundle.report.summary.automatic = 999;
    vi.stubGlobal('browser', {
      storage: { local: { get: vi.fn(async () => ({ [MIGRATION_STORAGE_KEY]: migration })) } },
    });

    await expect(loadStoredMigration()).resolves.toBeNull();
  });
});
