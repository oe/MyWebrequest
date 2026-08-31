import { describe, expect, it, vi } from 'vitest';

import { applyMigration, createPendingMigration, rollbackMigration } from '@/application/migration-apply';
import { createMigrationBundle } from '@/application/migration-service';
import { createEmptyState } from '@/domain/rules/fixtures';

import fixture from '../fixtures/legacy-installation.json';

const stagedAt = '2026-08-31T01:00:00.000Z';
const appliedAt = '2026-08-31T01:05:00.000Z';

async function pendingMigration() {
  const bundle = await createMigrationBundle(fixture, 'legacy-json-import', stagedAt);
  return createPendingMigration(bundle, stagedAt);
}

describe('migration application', () => {
  it('preselects only automatic candidates', async () => {
    const migration = await pendingMigration();
    const selectedItems = migration.bundle.report.items.filter((item) =>
      migration.selectedItemIds.includes(item.id),
    );

    expect(selectedItems).toHaveLength(2);
    expect(selectedItems.every((item) => item.outcome === 'automatic' && item.candidateRule)).toBe(true);
  });

  it('atomically merges selected rules without enabling them', async () => {
    const previous = createEmptyState();
    const migration = await pendingMigration();
    const reconcile = vi.fn(async () => undefined);
    const commit = vi.fn(async () => undefined);

    const result = await applyMigration(
      previous,
      migration,
      migration.selectedItemIds,
      { reconcile, commit },
      appliedAt,
    );

    expect(result.changed).toBe(true);
    expect(result.migration).toMatchObject({
      status: 'applied',
      appliedAt,
      preMigrationState: previous,
    });
    expect(result.state.order).toHaveLength(2);
    expect(Object.values(result.state.rules).every((rule) => !rule.enabled)).toBe(true);
    expect(reconcile).toHaveBeenCalledWith(result.state);
    expect(commit).toHaveBeenCalledWith(result.state, result.migration);
  });

  it('normalizes duplicate selections before persisting the applied record', async () => {
    const migration = await pendingMigration();
    const selectedId = migration.selectedItemIds[0];
    expect(selectedId).toBeDefined();
    if (!selectedId) return;

    const result = await applyMigration(
      createEmptyState(),
      migration,
      [selectedId, selectedId],
      { reconcile: vi.fn(async () => undefined), commit: vi.fn(async () => undefined) },
      appliedAt,
    );

    expect(result.migration.selectedItemIds).toEqual([selectedId]);
    expect(result.state.order).toEqual([selectedId]);
  });

  it('unlocks a review candidate only after the user explicitly selects it', async () => {
    const migration = await pendingMigration();
    const reviewItem = migration.bundle.report.items.find(
      (item) => item.outcome === 'review-required' && item.candidateRule,
    );
    expect(reviewItem).toBeDefined();
    if (!reviewItem) return;

    const result = await applyMigration(
      createEmptyState(),
      migration,
      [reviewItem.id],
      { reconcile: vi.fn(async () => undefined), commit: vi.fn(async () => undefined) },
      appliedAt,
    );

    expect(result.state.rules[reviewItem.id]).toMatchObject({
      enabled: false,
      migrationState: 'none',
    });
    expect(result.migration.bundle.report.items.find((item) => item.id === reviewItem.id)).toMatchObject({
      outcome: 'review-required',
      candidateRule: { migrationState: 'review-required' },
    });
  });

  it('is idempotent after the same migration has been applied', async () => {
    const migration = await pendingMigration();
    const ports = { reconcile: vi.fn(async () => undefined), commit: vi.fn(async () => undefined) };
    const first = await applyMigration(
      createEmptyState(),
      migration,
      migration.selectedItemIds,
      ports,
      appliedAt,
    );
    ports.reconcile.mockClear();
    ports.commit.mockClear();

    const second = await applyMigration(
      first.state,
      first.migration,
      first.migration.selectedItemIds,
      ports,
      appliedAt,
    );

    expect(second).toEqual({ state: first.state, migration: first.migration, changed: false });
    expect(ports.reconcile).not.toHaveBeenCalled();
    expect(ports.commit).not.toHaveBeenCalled();
  });

  it('restores browser rules when the atomic storage commit fails', async () => {
    const previous = createEmptyState();
    const migration = await pendingMigration();
    const saveError = new Error('storage unavailable');
    const reconcile = vi.fn(async () => undefined);

    await expect(
      applyMigration(
        previous,
        migration,
        migration.selectedItemIds,
        { reconcile, commit: vi.fn(async () => Promise.reject(saveError)) },
        appliedAt,
      ),
    ).rejects.toBe(saveError);
    expect(reconcile).toHaveBeenCalledTimes(2);
    expect(reconcile).toHaveBeenLastCalledWith(previous);
  });

  it('restores the exact pre-migration snapshot on rollback', async () => {
    const previous = createEmptyState();
    const migration = await pendingMigration();
    const ports = { reconcile: vi.fn(async () => undefined), commit: vi.fn(async () => undefined) };
    const applied = await applyMigration(previous, migration, migration.selectedItemIds, ports, appliedAt);
    const rolledBackAt = '2026-08-31T01:10:00.000Z';

    const rolledBack = await rollbackMigration(applied.state, applied.migration, ports, rolledBackAt);

    expect(rolledBack.state).toEqual(previous);
    expect(rolledBack.migration).toMatchObject({ status: 'rolled-back', rolledBackAt });
    expect(ports.reconcile).toHaveBeenLastCalledWith(previous);
    expect(ports.commit).toHaveBeenLastCalledWith(previous, rolledBack.migration);
  });

  it('rejects selection of a non-applicable source item', async () => {
    const migration = await pendingMigration();
    const unsafeItem = migration.bundle.report.items.find((item) => item.outcome === 'unsupported');
    expect(unsafeItem).toBeDefined();
    if (!unsafeItem) return;

    await expect(
      applyMigration(
        createEmptyState(),
        migration,
        [unsafeItem.id],
        { reconcile: vi.fn(), commit: vi.fn() },
        appliedAt,
      ),
    ).rejects.toThrow('cannot be applied');
  });
});
