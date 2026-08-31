import type { MigrationBundle } from '@/domain/migration/model';
import type { StoredState } from '@/domain/rules/model';

import { RuleStateCompensationError } from './rule-transaction';

export type StoredMigration = {
  migrationVersion: 1;
  status: 'pending' | 'applied' | 'rolled-back';
  bundle: MigrationBundle;
  selectedItemIds: string[];
  stagedAt: string;
  appliedAt?: string;
  rolledBackAt?: string;
  appliedRuleIds: string[];
  preMigrationState?: StoredState;
};

export type MigrationApplyPorts = {
  reconcile: (state: StoredState) => Promise<void>;
  commit: (state: StoredState, migration: StoredMigration) => Promise<void>;
};

export type MigrationApplyResult = {
  state: StoredState;
  migration: StoredMigration;
  changed: boolean;
};

export function createPendingMigration(bundle: MigrationBundle, stagedAt: string): StoredMigration {
  return {
    migrationVersion: 1,
    status: 'pending',
    bundle,
    selectedItemIds: bundle.report.items
      .filter((item) => item.outcome === 'automatic' && item.candidateRule)
      .map((item) => item.id),
    stagedAt,
    appliedRuleIds: [],
  };
}

function mergeSelectedRules(
  state: StoredState,
  migration: StoredMigration,
  selectedItemIds: readonly string[],
): { state: StoredState; appliedRuleIds: string[] } {
  const selected = new Set(selectedItemIds);
  const knownIds = new Set(migration.bundle.report.items.map((item) => item.id));
  const unknownSelection = [...selected].find((id) => !knownIds.has(id));
  if (unknownSelection) throw new Error(`Unknown migration item: ${unknownSelection}`);

  const candidates = migration.bundle.report.items.flatMap((item) => {
    if (!selected.has(item.id)) return [];
    if (!item.candidateRule) throw new Error(`Migration item cannot be applied: ${item.id}`);
    if (!['automatic', 'review-required'].includes(item.outcome)) {
      throw new Error(`Unsafe migration item cannot be applied: ${item.id}`);
    }
    return [{ ...item.candidateRule, enabled: false, migrationState: 'none' as const }];
  });

  const rules = { ...state.rules };
  const addedIds: string[] = [];
  for (const candidate of candidates) {
    const existing = rules[candidate.id];
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(candidate)) {
        throw new Error(`Migration rule ID conflicts with existing data: ${candidate.id}`);
      }
      continue;
    }
    rules[candidate.id] = candidate;
    addedIds.push(candidate.id);
  }
  return {
    state: { ...state, rules, order: [...addedIds, ...state.order] },
    appliedRuleIds: candidates.map((candidate) => candidate.id),
  };
}

async function commitWithCompensation(
  previousState: StoredState,
  nextState: StoredState,
  migration: StoredMigration,
  ports: MigrationApplyPorts,
): Promise<void> {
  await ports.reconcile(nextState);
  try {
    await ports.commit(nextState, migration);
  } catch (saveError) {
    try {
      await ports.reconcile(previousState);
    } catch (compensationError) {
      throw new RuleStateCompensationError(saveError, compensationError);
    }
    throw saveError;
  }
}

export async function applyMigration(
  currentState: StoredState,
  migration: StoredMigration,
  selectedItemIds: readonly string[],
  ports: MigrationApplyPorts,
  appliedAt: string,
): Promise<MigrationApplyResult> {
  if (migration.status === 'applied') {
    return { state: currentState, migration, changed: false };
  }
  if (migration.status !== 'pending') throw new Error('Only a pending migration can be applied.');

  const normalizedSelection = [...new Set(selectedItemIds)];
  const merged = mergeSelectedRules(currentState, migration, normalizedSelection);
  const appliedMigration: StoredMigration = {
    ...migration,
    status: 'applied',
    selectedItemIds: normalizedSelection,
    appliedRuleIds: merged.appliedRuleIds,
    preMigrationState: currentState,
    appliedAt,
  };
  await commitWithCompensation(currentState, merged.state, appliedMigration, ports);
  return { state: merged.state, migration: appliedMigration, changed: true };
}

export async function rollbackMigration(
  currentState: StoredState,
  migration: StoredMigration,
  ports: MigrationApplyPorts,
  rolledBackAt: string,
): Promise<MigrationApplyResult> {
  if (migration.status === 'rolled-back') {
    return { state: currentState, migration, changed: false };
  }
  if (migration.status !== 'applied' || !migration.preMigrationState) {
    throw new Error('Only an applied migration with a recovery snapshot can be rolled back.');
  }

  const rolledBackMigration: StoredMigration = {
    ...migration,
    status: 'rolled-back',
    rolledBackAt,
  };
  await commitWithCompensation(currentState, migration.preMigrationState, rolledBackMigration, ports);
  return { state: migration.preMigrationState, migration: rolledBackMigration, changed: true };
}
