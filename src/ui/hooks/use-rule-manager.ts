import { useCallback, useEffect, useMemo, useState } from 'react';

import { createRule, removeRule, updatePausedState, upsertRule } from '@/application/rule-service';
import type { Rule, StoredState } from '@/domain/rules/model';
import { deriveRuleStatus } from '@/domain/rules/validate';
import {
  hasRulePermission,
  reconcileDynamicRules,
  requestRulePermission,
} from '@/infrastructure/rule-runtime';
import { loadState, saveState, subscribeToState } from '@/infrastructure/rule-store';

type PermissionMap = Record<string, boolean>;

export function useRuleManager() {
  const [state, setState] = useState<StoredState | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshPermissions = useCallback(async (nextState: StoredState) => {
    const entries = await Promise.all(
      nextState.order.map(async (id) => {
        const rule = nextState.rules[id];
        return [id, rule ? await hasRulePermission(rule) : false] as const;
      }),
    );
    setPermissions(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadState().then(async (loaded) => {
      if (cancelled) return;
      setState(loaded);
      setSelectedId(loaded.order[0] ?? null);
      await refreshPermissions(loaded);
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshPermissions]);

  useEffect(
    () =>
      subscribeToState((nextState) => {
        setState(nextState);
        setSelectedId((currentId) =>
          currentId && nextState.rules[currentId] ? currentId : (nextState.order[0] ?? null),
        );
        void refreshPermissions(nextState);
      }),
    [refreshPermissions],
  );

  const persist = useCallback(
    async (nextState: StoredState) => {
      await reconcileDynamicRules(nextState);
      try {
        await saveState(nextState);
      } catch (error) {
        if (state) await reconcileDynamicRules(state);
        throw error;
      }
      setState(nextState);
      await refreshPermissions(nextState);
    },
    [refreshPermissions, state],
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

  const rules = useMemo(
    () => state?.order.flatMap((id) => (state.rules[id] ? [state.rules[id]] : [])) ?? [],
    [state],
  );

  const statuses = useMemo(
    () =>
      Object.fromEntries(
        rules.map((rule) => [rule.id, deriveRuleStatus(rule, permissions[rule.id] === true)]),
      ),
    [permissions, rules],
  );

  return {
    addRule,
    deleteRule,
    loading,
    permissions,
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
