import type { Rule, StoredState } from '@/domain/rules/model';

export type RuleRuntimeSnapshot = {
  permissions: Record<string, boolean>;
  installedRuleIds: Set<number> | null;
};

export type RuleRuntimeSnapshotPorts = {
  reconcile: (state: StoredState) => Promise<void>;
  hasPermission: (rule: Rule) => Promise<boolean>;
  getInstalledRuleIds: () => Promise<Set<number> | null>;
};

export async function readRuleRuntimeSnapshot(
  state: StoredState,
  ports: Pick<RuleRuntimeSnapshotPorts, 'hasPermission' | 'getInstalledRuleIds'>,
): Promise<RuleRuntimeSnapshot> {
  const [permissionEntries, installedRuleIds] = await Promise.all([
    Promise.all(
      state.order.map(async (id) => {
        const rule = state.rules[id];
        return [id, rule ? await ports.hasPermission(rule) : false] as const;
      }),
    ),
    ports.getInstalledRuleIds(),
  ]);

  return {
    permissions: Object.fromEntries(permissionEntries),
    installedRuleIds,
  };
}

export async function synchronizeRuleRuntimeSnapshot(
  state: StoredState,
  ports: RuleRuntimeSnapshotPorts,
): Promise<RuleRuntimeSnapshot> {
  await ports.reconcile(state);
  return readRuleRuntimeSnapshot(state, ports);
}
