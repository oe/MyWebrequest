import { afterEach, describe, expect, it, vi } from 'vitest';

import { sampleRules } from '@/domain/rules/fixtures';
import type { Rule, StoredState } from '@/domain/rules/model';
import {
  getInstalledDynamicRuleIds,
  reconcileDynamicRules,
  subscribeToPermissionChanges,
} from '@/infrastructure/rule-runtime';

function stateWith(rule: Rule, globallyPaused = false): StoredState {
  return {
    schemaVersion: 1,
    rules: { [rule.id]: rule },
    order: [rule.id],
    settings: { globallyPaused },
  };
}

function eventMock() {
  const listeners = new Set<() => void>();
  return {
    addListener: vi.fn((listener: () => void) => listeners.add(listener)),
    removeListener: vi.fn((listener: () => void) => listeners.delete(listener)),
    fire: () => listeners.forEach((listener) => listener()),
  };
}

function installBrowserMock(options: { installedIds: number[]; permitted: boolean }) {
  const onAdded = eventMock();
  const onRemoved = eventMock();
  const updateDynamicRules = vi.fn(async () => undefined);

  vi.stubGlobal('browser', {
    declarativeNetRequest: {
      getDynamicRules: vi.fn(async () => options.installedIds.map((id) => ({ id }))),
      updateDynamicRules,
    },
    permissions: {
      contains: vi.fn(async () => options.permitted),
      request: vi.fn(async () => options.permitted),
      onAdded,
      onRemoved,
    },
  });

  return { onAdded, onRemoved, updateDynamicRules };
}

describe('rule runtime reconciliation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('replaces every installed dynamic rule with the permitted canonical state', async () => {
    const rule = sampleRules[1];
    expect(rule).toBeDefined();
    if (!rule) return;

    const runtime = installBrowserMock({ installedIds: [777, rule.dnrId], permitted: true });
    await reconcileDynamicRules(stateWith(rule));

    expect(runtime.updateDynamicRules).toHaveBeenCalledWith({
      removeRuleIds: [777, rule.dnrId],
      addRules: [
        {
          id: rule.dnrId,
          priority: rule.priority,
          condition: {
            urlFilter: '||analytics.example.com^',
            resourceTypes: ['ping', 'xmlhttprequest'],
          },
          action: { type: 'block' },
        },
      ],
    });
  });

  it.each([
    { label: 'the rule was deleted', state: null, permitted: true },
    { label: 'host permission was revoked', state: 'active', permitted: false },
    { label: 'all rules are paused', state: 'paused', permitted: true },
  ])('removes stale dynamic rules when $label', async ({ state, permitted }) => {
    const rule = sampleRules[1];
    expect(rule).toBeDefined();
    if (!rule) return;

    const runtime = installBrowserMock({ installedIds: [rule.dnrId], permitted });
    const nextState =
      state === null
        ? { schemaVersion: 1, rules: {}, order: [], settings: { globallyPaused: false } }
        : stateWith(rule, state === 'paused');

    await reconcileDynamicRules(nextState as StoredState);

    expect(runtime.updateDynamicRules).toHaveBeenCalledWith({
      removeRuleIds: [rule.dnrId],
      addRules: [],
    });
  });

  it('subscribes to permission grants and revocations with cleanup', () => {
    const runtime = installBrowserMock({ installedIds: [], permitted: true });
    const listener = vi.fn();

    const unsubscribe = subscribeToPermissionChanges(listener);
    runtime.onAdded.fire();
    runtime.onRemoved.fire();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    runtime.onAdded.fire();
    runtime.onRemoved.fire();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('reports the exact installed dynamic rule IDs', async () => {
    installBrowserMock({ installedIds: [101, 202], permitted: true });
    await expect(getInstalledDynamicRuleIds()).resolves.toEqual(new Set([101, 202]));
  });
});
