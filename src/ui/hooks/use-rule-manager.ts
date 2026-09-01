import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  createRule,
  duplicateRule,
  removeRule,
  restoreRule,
  updatePausedState,
  upsertRule,
} from '@/application/rule-service';
import { commitRuleState } from '@/application/rule-transaction';
import { analyzeRuleState, getRuleQuotaUsage } from '@/domain/rules/diagnostics';
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

export function useRuleManager() {
  const [state, setState] = useState<StoredState | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [installedRuleIds, setInstalledRuleIds] = useState<InstalledRuleIds>(undefined);
  const [runtimeError, setRuntimeError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importRecovery, setImportRecovery] = useState<RuleImportRecovery | null>(null);
  const stateRef = useRef<StoredState | null>(null);

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
      stateRef.current = nextState;
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
      stateRef.current = loaded;
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
        };
      }
      const nextState = upsertRule(current, rule);
      if (getRuleQuotaUsage(nextState).remaining < 0) {
        return {
          permissionGranted: permissions[rule.id] === true,
          regexSupported: true,
          quotaAvailable: false,
          cycleFree: true,
        };
      }
      if (analyzeRuleState(nextState)[rule.id]?.some((item) => item.code === 'redirect-cycle')) {
        return {
          permissionGranted: permissions[rule.id] === true,
          regexSupported: true,
          quotaAvailable: true,
          cycleFree: false,
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
        };
      }
      await persist(nextState);
      return { permissionGranted, regexSupported: true, quotaAvailable: true, cycleFree: true };
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
        };
      }
      const rule = current.rules[id];
      if (!rule) {
        return {
          permissionGranted: false,
          regexSupported: false,
          quotaAvailable: false,
          cycleFree: false,
        };
      }
      const nextRule = { ...rule, enabled };
      const nextState = upsertRule(current, nextRule);
      if (getRuleQuotaUsage(nextState).remaining < 0) {
        return {
          permissionGranted: permissions[id] === true,
          regexSupported: true,
          quotaAvailable: false,
          cycleFree: true,
        };
      }
      if (analyzeRuleState(nextState)[id]?.some((item) => item.code === 'redirect-cycle')) {
        return {
          permissionGranted: permissions[id] === true,
          regexSupported: true,
          quotaAvailable: true,
          cycleFree: false,
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
        };
      }
      await persist(nextState);
      return { permissionGranted, regexSupported: true, quotaAvailable: true, cycleFree: true };
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

  const diagnostics = useMemo(() => (state ? analyzeRuleState(state) : {}), [state]);
  const quota = useMemo(() => (state ? getRuleQuotaUsage(state) : null), [state]);

  return {
    adoptState,
    addRule,
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
