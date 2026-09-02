import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  createRule,
  createStarterRule,
  duplicateRule,
  removeRule,
  restoreRule,
  updatePausedState,
  upsertRule,
} from '@/application/rule-service';
import type { StarterRuleKind } from '@/application/rule-service';
import { commitRuleState } from '@/application/rule-transaction';
import {
  readRuleRuntimeSnapshot,
  synchronizeRuleRuntimeSnapshot,
  type RuleRuntimeSnapshot,
} from '@/application/rule-runtime-snapshot';
import { analyzeRuleState, createRuleRuntimePlan, getRuleQuotaUsage } from '@/domain/rules/diagnostics';
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
  checkRuleRegexSupport,
  getInstalledDynamicRuleIds,
  hasRulePermission,
  reconcileDynamicRules,
  requestRulePermission,
  subscribeToPermissionChanges,
} from '@/infrastructure/rule-runtime';
import { loadState, saveState, subscribeToState } from '@/infrastructure/rule-store';

type PermissionMap = Record<string, boolean>;
type InstalledRuleIds = Set<number> | null | undefined;

const runtimeSnapshotPorts = {
  reconcile: reconcileDynamicRules,
  hasPermission: hasRulePermission,
  getInstalledRuleIds: getInstalledDynamicRuleIds,
};

export function useRuleManager() {
  const [state, setState] = useState<StoredState | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [installedRuleIds, setInstalledRuleIds] = useState<InstalledRuleIds>(undefined);
  const [runtimeError, setRuntimeError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importRecovery, setImportRecovery] = useState<RuleImportRecovery | null>(null);
  const stateRef = useRef<StoredState | null>(null);

  const applyRuntimeSnapshot = useCallback((snapshot: RuleRuntimeSnapshot) => {
    setPermissions(snapshot.permissions);
    setInstalledRuleIds(snapshot.installedRuleIds);
    setRuntimeError(false);
  }, []);

  const refreshRuntimeState = useCallback(
    async (nextState: StoredState) => {
      try {
        applyRuntimeSnapshot(await readRuleRuntimeSnapshot(nextState, runtimeSnapshotPorts));
      } catch (error) {
        console.error('Failed to read extension runtime state.', error);
        setPermissions({});
        setInstalledRuleIds(undefined);
        setRuntimeError(true);
      }
    },
    [applyRuntimeSnapshot],
  );

  const synchronizeRuntimeState = useCallback(
    async (nextState: StoredState) => {
      try {
        applyRuntimeSnapshot(await synchronizeRuleRuntimeSnapshot(nextState, runtimeSnapshotPorts));
      } catch (error) {
        console.error('Failed to reconcile extension runtime state.', error);
        setPermissions({});
        setInstalledRuleIds(undefined);
        setRuntimeError(true);
      }
    },
    [applyRuntimeSnapshot],
  );

  const adoptState = useCallback(
    async (nextState: StoredState, synchronize = false) => {
      stateRef.current = nextState;
      setState(nextState);
      setSelectedId((currentId) =>
        currentId && nextState.rules[currentId] ? currentId : (nextState.order[0] ?? null),
      );
      await (synchronize ? synchronizeRuntimeState(nextState) : refreshRuntimeState(nextState));
    },
    [refreshRuntimeState, synchronizeRuntimeState],
  );

  useEffect(() => {
    let cancelled = false;
    void Promise.all([loadState(), loadRuleImportRecovery()]).then(async ([loaded, recovery]) => {
      if (cancelled) return;
      setImportRecovery(recovery);
      await adoptState(loaded, true);
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [adoptState]);

  useEffect(
    () =>
      subscribeToState((nextState) => {
        void adoptState(nextState, true);
      }),
    [adoptState],
  );

  useEffect(() => {
    if (!state) return;
    return subscribeToPermissionChanges(() => {
      void synchronizeRuntimeState(state);
    });
  }, [state, synchronizeRuntimeState]);

  const persist = useCallback(
    async (nextState: StoredState) => {
      const previousState = stateRef.current;
      if (!previousState) return;
      await commitRuleState(previousState, nextState, { reconcile: reconcileDynamicRules, save: saveState });
      await adoptState(nextState);
    },
    [adoptState],
  );

  const saveRule = useCallback(
    async (rule: Rule) => {
      const current = stateRef.current;
      if (!current) {
        return {
          permissionGranted: false,
          regexSupported: false,
          quotaAvailable: false,
          cycleFree: false,
          priorityConflictFree: false,
        };
      }
      const nextState = upsertRule(current, rule);
      const nextDiagnostics = analyzeRuleState(nextState)[rule.id] ?? [];
      if (nextDiagnostics.some((item) => item.code === 'redirect-cycle')) {
        return {
          permissionGranted: permissions[rule.id] === true,
          regexSupported: true,
          quotaAvailable: true,
          cycleFree: false,
          priorityConflictFree: true,
        };
      }
      if (nextDiagnostics.some((item) => item.code === 'priority-conflict')) {
        return {
          permissionGranted: permissions[rule.id] === true,
          regexSupported: true,
          quotaAvailable: true,
          cycleFree: true,
          priorityConflictFree: false,
        };
      }
      if (rule.enabled && createRuleRuntimePlan(nextState).quotaBlockedRuleIds.has(rule.id)) {
        return {
          permissionGranted: permissions[rule.id] === true,
          regexSupported: true,
          quotaAvailable: false,
          cycleFree: true,
          priorityConflictFree: true,
        };
      }
      // Firefox requires permissions.request() to be invoked in the same user
      // activation turn. Start it before the first await; the editor's explicit
      // confirmation button is the user gesture that reaches this callback.
      const permissionPromise = rule.enabled ? requestRulePermission(rule) : Promise.resolve(true);
      const regexSupportPromise = checkRuleRegexSupport(rule);
      const [permissionGranted, regexSupport] = await Promise.all([permissionPromise, regexSupportPromise]);
      if (rule.enabled && !regexSupport.isSupported) {
        return {
          permissionGranted,
          regexSupported: false,
          regexReason: regexSupport.reason,
          quotaAvailable: true,
          cycleFree: true,
          priorityConflictFree: true,
        };
      }
      await persist(nextState);
      return {
        permissionGranted,
        regexSupported: true,
        quotaAvailable: true,
        cycleFree: true,
        priorityConflictFree: true,
      };
    },
    [permissions, persist],
  );

  const toggleRule = useCallback(
    async (id: string, enabled: boolean) => {
      const current = stateRef.current;
      if (!current) {
        return {
          permissionGranted: false,
          regexSupported: false,
          quotaAvailable: false,
          cycleFree: false,
          priorityConflictFree: false,
        };
      }
      const rule = current.rules[id];
      if (!rule) {
        return {
          permissionGranted: false,
          regexSupported: false,
          quotaAvailable: false,
          cycleFree: false,
          priorityConflictFree: false,
        };
      }
      const nextRule = { ...rule, enabled };
      const nextState = upsertRule(current, nextRule);
      const nextDiagnostics = analyzeRuleState(nextState)[id] ?? [];
      if (nextDiagnostics.some((item) => item.code === 'redirect-cycle')) {
        return {
          permissionGranted: permissions[id] === true,
          regexSupported: true,
          quotaAvailable: true,
          cycleFree: false,
          priorityConflictFree: true,
        };
      }
      if (nextDiagnostics.some((item) => item.code === 'priority-conflict')) {
        return {
          permissionGranted: permissions[id] === true,
          regexSupported: true,
          quotaAvailable: true,
          cycleFree: true,
          priorityConflictFree: false,
        };
      }
      if (enabled && createRuleRuntimePlan(nextState).quotaBlockedRuleIds.has(id)) {
        return {
          permissionGranted: permissions[id] === true,
          regexSupported: true,
          quotaAvailable: false,
          cycleFree: true,
          priorityConflictFree: true,
        };
      }
      // Keep the permission request inside the originating click gesture for
      // Firefox. Already-granted origins resolve without another prompt.
      const permissionPromise = enabled ? requestRulePermission(nextRule) : Promise.resolve(true);
      const regexSupportPromise = checkRuleRegexSupport(nextRule);
      const [permissionGranted, regexSupport] = await Promise.all([permissionPromise, regexSupportPromise]);
      if (enabled && !regexSupport.isSupported) {
        return {
          permissionGranted,
          regexSupported: false,
          regexReason: regexSupport.reason,
          quotaAvailable: true,
          cycleFree: true,
          priorityConflictFree: true,
        };
      }
      await persist(nextState);
      return {
        permissionGranted,
        regexSupported: true,
        quotaAvailable: true,
        cycleFree: true,
        priorityConflictFree: true,
      };
    },
    [permissions, persist],
  );

  const addRule = useCallback(
    async (origin?: string, name?: string) => {
      const current = stateRef.current;
      if (!current) return;
      const rule = createRule(origin, name);
      await persist(upsertRule(current, rule));
      setSelectedId(rule.id);
    },
    [persist],
  );

  const addStarterRule = useCallback(
    async (kind: StarterRuleKind, name: string) => {
      const current = stateRef.current;
      if (!current) return;
      const rule = createStarterRule(kind, name);
      await persist(upsertRule(current, rule));
      setSelectedId(rule.id);
    },
    [persist],
  );

  const deleteRule = useCallback(
    async (id: string) => {
      const current = stateRef.current;
      if (!current) return;
      const next = removeRule(current, id);
      await persist(next);
      setSelectedId(next.order[0] ?? null);
    },
    [persist],
  );

  const copyRule = useCallback(
    async (id: string, name: string) => {
      const current = stateRef.current;
      const source = current?.rules[id];
      if (!current || !source) return;
      const duplicated = duplicateRule(current, source, name);
      await persist(duplicated.state);
    },
    [persist],
  );

  const undoDeleteRule = useCallback(
    async (rule: Rule, index: number) => {
      const current = stateRef.current;
      if (!current) return;
      await persist(restoreRule(current, rule, index));
      setSelectedId(rule.id);
    },
    [persist],
  );

  const setGloballyPaused = useCallback(
    async (paused: boolean) => {
      const current = stateRef.current;
      if (!current) return;
      await persist(updatePausedState(current, paused));
    },
    [persist],
  );

  const replaceStateFromImport = useCallback(
    async (nextState: StoredState, mode: RuleImportMode) => {
      const current = stateRef.current;
      if (!current) return;
      if (mode === 'replace') {
        const recovery: RuleImportRecovery = {
          version: 1,
          createdAt: new Date().toISOString(),
          state: current,
        };
        await saveRuleImportRecovery(recovery);
        setImportRecovery(recovery);
      }
      await persist(nextState);
    },
    [persist],
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

  const diagnostics = useMemo(() => (state ? analyzeRuleState(state) : {}), [state]);
  const runtimePlan = useMemo(() => (state ? createRuleRuntimePlan(state) : null), [state]);
  const statuses = useMemo(
    () =>
      Object.fromEntries(
        rules.map((rule) => [
          rule.id,
          deriveRuleStatus(rule, permissions[rule.id] === true, {
            globallyPaused: state?.settings.globallyPaused,
            isInstalled: installedRuleIds?.has(rule.dnrId),
            runtimeError,
            conflicted: runtimePlan?.conflictedRuleIds.has(rule.id),
            quotaBlocked: runtimePlan?.quotaBlockedRuleIds.has(rule.id),
          }),
        ]),
      ),
    [installedRuleIds, permissions, rules, runtimeError, runtimePlan, state?.settings.globallyPaused],
  );

  const quota = useMemo(() => (state ? getRuleQuotaUsage(state) : null), [state]);

  return {
    adoptState,
    addRule,
    addStarterRule,
    copyRule,
    deleteRule,
    diagnostics,
    loading,
    importRecovery,
    permissions,
    quota,
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
    undoDeleteRule,
  };
}
