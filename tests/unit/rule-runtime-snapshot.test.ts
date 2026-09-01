import { describe, expect, it, vi } from 'vitest';

import { readRuleRuntimeSnapshot, synchronizeRuleRuntimeSnapshot } from '@/application/rule-runtime-snapshot';
import { createSampleState } from '@/domain/rules/fixtures';

describe('rule runtime snapshot', () => {
  it('reads permissions and installed rules in parallel', async () => {
    const state = createSampleState();
    const hasPermission = vi.fn(async () => true);
    const getInstalledRuleIds = vi.fn(async () => new Set([1001, 1002]));

    const snapshot = await readRuleRuntimeSnapshot(state, {
      hasPermission,
      getInstalledRuleIds,
    });

    expect(hasPermission).toHaveBeenCalledTimes(state.order.length);
    expect(snapshot.permissions).toEqual(Object.fromEntries(state.order.map((id) => [id, true])));
    expect(snapshot.installedRuleIds).toEqual(new Set([1001, 1002]));
  });

  it('reconciles before inspecting installed rules after a lifecycle change', async () => {
    const state = createSampleState();
    const calls: string[] = [];

    const snapshot = await synchronizeRuleRuntimeSnapshot(state, {
      reconcile: vi.fn(async () => {
        calls.push('reconcile');
      }),
      hasPermission: vi.fn(async () => {
        calls.push('permission');
        return true;
      }),
      getInstalledRuleIds: vi.fn(async () => {
        calls.push('installed');
        return new Set([1002]);
      }),
    });

    expect(calls[0]).toBe('reconcile');
    expect(calls.slice(1)).toContain('installed');
    expect(snapshot.installedRuleIds).toEqual(new Set([1002]));
  });

  it('does not report a stale snapshot when reconciliation fails', async () => {
    const failure = new Error('DNR update failed');
    const getInstalledRuleIds = vi.fn(async () => new Set([1002]));

    await expect(
      synchronizeRuleRuntimeSnapshot(createSampleState(), {
        reconcile: vi.fn(async () => Promise.reject(failure)),
        hasPermission: vi.fn(async () => true),
        getInstalledRuleIds,
      }),
    ).rejects.toBe(failure);
    expect(getInstalledRuleIds).not.toHaveBeenCalled();
  });
});
