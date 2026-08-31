import { useCallback, useEffect, useMemo, useState } from 'react';

import { createRule, removeRule, updatePausedState, upsertRule } from '@/application/rule-service';
import { commitRuleState } from '@/application/rule-transaction';
import type { Rule, StoredState } from '@/domain/rules/model';
import { deriveRuleStatus } from '@/domain/rules/validate';
import type { RuleImportMode } from '@/application/rule-backup';
import {
  clearRuleImportRecovery,
  loadRuleImportRecovery,
  saveRuleImportRecovery,
  type RuleImportRecovery,
} from '@/infrastructure/rule-import-recovery';
import {
  getInstalledDynamicRuleIds,
  hasRulePermission,
  reconcileDynamicRules,
  requestRulePermission,
  subscribeToPermissionChanges,
} from '@/infrastructure/rule-runtime';
import { loadState, saveState, subscribeToState } from '@/infrastructure/rule-store';

type PermissionMap = Record<string, boolean>;
type InstalledRuleIds = Set<number> | null | undefined;

export function useRuleManager() {
  const [state, setState] = useState<StoredState | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [installedRuleIds, setInstalledRuleIds] = useState<InstalledRuleIds>(undefined);
  const [runtimeError, setRuntimeError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importRecovery, setImportRecovery] = useState<RuleImportRecovery | null>(null);

  const refreshRuntimeState = useCallback(async (nextState: StoredState) => {
    try {
      const [entries, installedIds] = await Promise.all([
        Promise.all(
          nextState.order.map(async (id) => {
            const rule = nextState.rules[id];
            return [id, rule ? await hasRulePermission(rule) : false] as const;
          }),
        ),
        getInstalledDynamicRuleIds(),
      ]);
      setPermissions(Object.fromEntries(entries));
      setInstalledRuleIds(installedIds);
      setRuntimeError(false);
    } catch (error) {
      console.error('Failed to read extension runtime state.', error);
      setInstalledRuleIds(undefined);
      setRuntimeError(true);
    }
  }, []);

  const adoptState = useCallback(
    async (nextState: StoredState) => {
      setState(nextState);
      setSelectedId((currentId) =>
        currentId && nextState.rules[currentId] ? currentId : (nextState.order[0] ?? null),
      );
      await refreshRuntimeState(nextState);
    },
    [refreshRuntimeState],
  );

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadState(), loadRuleImportRecovery()]).then(async ([loaded, recovery]) => {
      if (cancelled) return;
      setState(loaded);
      setImportRecovery(recovery);
      setSelectedId(loaded.order[0] ?? null);
      await refreshRuntimeState(loaded);
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshRuntimeState]);

  useEffect(
    () =>
      subscribeToState((nextState) => {
        void adoptState(nextState);
      }),
    [adoptState],
  );

  useEffect(() => {
    if (!state) return;
    return subscribeToPermissionChanges(() => {
      void refreshRuntimeState(state);
    });
  }, [refreshRuntimeState, state]);

  const persist = useCallback(
    async (nextState: StoredState) => {
      if (!state) return;
      await commitRuleState(state, nextState, { reconcile: reconcileDynamicRules, save: saveState });
      await adoptState(nextState);
    },
    [adoptState, state],
  );

  const saveRule = useCallback(
    async (rule: Rule) => {
      if (!state) return { permissionGranted: false };
      const permissionGranted =
        !rule.enabled || permissions[rule.id] === true || (await requestRulePermission(rule));
      await persist(upsertRule(state, rule));
      return { permissionGranted };
    },
    [permissions, persist, state],
  );

  const toggleRule = useCallback(
    async (id: string, enabled: boolean) => {
      if (!state) return false;
      const rule = state.rules[id];
      if (!rule) return false;
      const nextRule = { ...rule, enabled };
      const permissionGranted =
        !enabled || permissions[id] === true || (await requestRulePermission(nextRule));
      await persist(upsertRule(state, nextRule));
      return permissionGranted;
    },
    [permissions, persist, state],
  );

  const addRule = useCallback(
    async (origin?: string) => {
      if (!state) return;
      const rule = createRule(origin);
      await persist(upsertRule(state, rule));
      setSelectedId(rule.id);
    },
    [persist, state],
  );

  const deleteRule = useCallback(
    async (id: string) => {
      if (!state) return;
      const next = removeRule(state, id);
      await persist(next);
      setSelectedId(next.order[0] ?? null);
    },
    [persist, state],
  );

  const setGloballyPaused = useCallback(
    async (paused: boolean) => {
      if (!state) return;
      await persist(updatePausedState(state, paused));
    },
    [persist, state],
  );

  const replaceStateFromImport = useCallback(
    async (nextState: StoredState, mode: RuleImportMode) => {
      if (!state) return;
      if (mode === 'replace') {
        const recovery: RuleImportRecovery = {
          version: 1,
          createdAt: new Date().toISOString(),
          state,
        };
        await saveRuleImportRecovery(recovery);
        setImportRecovery(recovery);
      }
      await persist(nextState);
    },
    [persist, state],
  );

  const restoreImportRecovery = useCallback(async () => {
    if (!importRecovery) return;
    await persist(importRecovery.state);
    await clearRuleImportRecovery();
    setImportRecovery(null);
  }, [importRecovery, persist]);

  const rules = useMemo(
    () => state?.order.flatMap((id) => (state.rules[id] ? [state.rules[id]] : [])) ?? [],
    [state],
  );

  const statuses = useMemo(
    () =>
      Object.fromEntries(
        rules.map((rule) => [
          rule.id,
          deriveRuleStatus(rule, permissions[rule.id] === true, {
            globallyPaused: state?.settings.globallyPaused,
            isInstalled: installedRuleIds?.has(rule.dnrId),
            runtimeError,
          }),
        ]),
      ),
    [installedRuleIds, permissions, rules, runtimeError, state?.settings.globallyPaused],
  );

  return {
    adoptState,
    addRule,
    deleteRule,
    loading,
    importRecovery,
    permissions,
    replaceStateFromImport,
    restoreImportRecovery,
    rules,
    saveRule,
    selectedId,
    setGloballyPaused,
    setSelectedId,
    state,
    statuses,
    toggleRule,
  };
}
