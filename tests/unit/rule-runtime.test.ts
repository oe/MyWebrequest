import { afterEach, describe, expect, it, vi } from 'vitest';

import { sampleRules } from '@/domain/rules/fixtures';
import type { Rule, StoredState } from '@/domain/rules/model';
import {
  checkRuleRegexSupport,
  getInstalledDynamicRuleIds,
  hasRulePermission,
  reconcileDynamicRules,
  requestRulePermission,
  subscribeToPermissionChanges,
} from '@/infrastructure/rule-runtime';

function stateWith(ruleOrRules: Rule | Rule[], globallyPaused = false): StoredState {
  const rules = Array.isArray(ruleOrRules) ? ruleOrRules : [ruleOrRules];
  return {
    schemaVersion: 1,
    rules: Object.fromEntries(rules.map((rule) => [rule.id, rule])),
    order: rules.map((rule) => rule.id),
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

function installBrowserMock(options: {
  installedIds: number[];
  permitted: boolean;
  regexSupported?: boolean;
}) {
  const onAdded = eventMock();
  const onRemoved = eventMock();
  const isRegexSupported = vi.fn(async () => ({
    isSupported: options.regexSupported ?? true,
    reason: options.regexSupported === false ? 'memoryLimitExceeded' : undefined,
  }));
  const updateDynamicRules = vi.fn(
    async (update: { removeRuleIds?: number[]; addRules?: Array<{ id: number }> }) => {
      void update;
    },
  );

  vi.stubGlobal('browser', {
    declarativeNetRequest: {
      getDynamicRules: vi.fn(async () => options.installedIds.map((id) => ({ id }))),
      isRegexSupported,
      updateDynamicRules,
    },
    permissions: {
      contains: vi.fn(async () => options.permitted),
      getAll: vi.fn(async () => ({
        origins: options.permitted
          ? ['http://*.app.example.com/*', 'https://*.app.example.com/*', 'https://api.example.com/*']
          : [],
      })),
      request: vi.fn(async () => options.permitted),
      onAdded,
      onRemoved,
    },
  });

  return {
    onAdded,
    onRemoved,
    isRegexSupported,
    updateDynamicRules,
    getAll: browser.permissions.getAll,
    request: browser.permissions.request,
  };
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

  it('uses an origin-wide lock so extension contexts cannot reconcile concurrently', async () => {
    const rule = sampleRules[1];
    expect(rule).toBeDefined();
    if (!rule) return;
    installBrowserMock({ installedIds: [], permitted: true });
    const request = vi.fn(async (_name: string, callback: () => Promise<void>) => callback());
    vi.stubGlobal('navigator', { locks: { request } });

    await reconcileDynamicRules(stateWith(rule));

    expect(request).toHaveBeenCalledWith('mywebrequest-dnr-reconcile', expect.any(Function));
  });

  it.each([
    { label: 'the rule was deleted', state: null },
    { label: 'all rules are paused', state: 'paused' },
  ])('removes stale dynamic rules when $label', async ({ state }) => {
    const rule = sampleRules[1];
    expect(rule).toBeDefined();
    if (!rule) return;

    const runtime = installBrowserMock({ installedIds: [rule.dnrId], permitted: true });
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

  it('removes a redirect rule when its request or initiator permission was revoked', async () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;
    const runtime = installBrowserMock({ installedIds: [rule.dnrId], permitted: false });

    await reconcileDynamicRules(stateWith(rule));

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

  it('requests bounded request and initiator origins for a subresource redirect', async () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;
    const runtime = installBrowserMock({ installedIds: [], permitted: true });

    await expect(hasRulePermission(rule)).resolves.toBe(true);
    await expect(requestRulePermission(rule)).resolves.toBe(true);

    const expected = {
      origins: ['http://*.app.example.com/*', 'https://*.app.example.com/*', 'https://api.example.com/*'],
    };
    expect(runtime.getAll).toHaveBeenCalledOnce();
    expect(runtime.request).toHaveBeenCalledWith(expected);
  });

  it('does not touch host permissions for a safe block rule', async () => {
    const rule = sampleRules[1];
    expect(rule).toBeDefined();
    if (!rule) return;
    const runtime = installBrowserMock({ installedIds: [], permitted: false });

    await expect(hasRulePermission(rule)).resolves.toBe(true);
    await expect(requestRulePermission(rule)).resolves.toBe(true);
    expect(runtime.getAll).not.toHaveBeenCalled();
    expect(runtime.request).not.toHaveBeenCalled();
  });

  it('does not mistake activeTab access for a persistent host grant', async () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;
    const runtime = installBrowserMock({ installedIds: [], permitted: false });
    browser.permissions.contains = vi.fn(async () => true);

    await expect(hasRulePermission(rule)).resolves.toBe(false);
    expect(browser.permissions.contains).not.toHaveBeenCalled();
    expect(runtime.getAll).toHaveBeenCalledOnce();
  });

  it('uses the browser DNR engine to reject an unsupported wildcard expression', async () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;
    const runtime = installBrowserMock({ installedIds: [], permitted: true, regexSupported: false });

    await expect(checkRuleRegexSupport(rule)).resolves.toEqual({
      isSupported: false,
      reason: 'memoryLimitExceeded',
    });
    expect(runtime.isRegexSupported).toHaveBeenCalledWith({
      regex: '^https://api\\.example\\.com/v1/(.*)$',
      requireCapturing: true,
    });
  });

  it('does not install rules whose regular expression is unsupported by the browser', async () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;
    const runtime = installBrowserMock({ installedIds: [], permitted: true, regexSupported: false });

    await reconcileDynamicRules(stateWith(rule));

    expect(runtime.updateDynamicRules).toHaveBeenCalledWith({ removeRuleIds: [], addRules: [] });
  });

  it('removes every same-condition priority conflict instead of leaving browser precedence ambiguous', async () => {
    const base = sampleRules[1];
    expect(base).toBeDefined();
    if (!base) return;
    const conflict = { ...base, id: 'runtime-conflict', dnrId: 6001 };
    const runtime = installBrowserMock({ installedIds: [base.dnrId, conflict.dnrId], permitted: true });

    await reconcileDynamicRules(stateWith([base, conflict]));

    expect(runtime.updateDynamicRules).toHaveBeenCalledWith({
      removeRuleIds: [base.dnrId, conflict.dnrId],
      addRules: [],
    });
  });

  it('installs only the deterministic internal quota allocation from oversized stored state', async () => {
    const base = sampleRules[1];
    expect(base).toBeDefined();
    if (!base) return;
    const rules = Array.from({ length: 4_501 }, (_, index): Rule => ({
      ...base,
      id: `quota-${index}`,
      dnrId: 10_000 + index,
      condition: {
        ...base.condition,
        url: { kind: 'url-filter', value: `||quota-${index}.example^` },
      },
    }));
    const runtime = installBrowserMock({ installedIds: [], permitted: true });

    await reconcileDynamicRules(stateWith(rules));

    const update = runtime.updateDynamicRules.mock.calls[0]?.[0];
    const addRules = update?.addRules ?? [];
    expect(addRules).toHaveLength(4_500);
    expect(addRules.at(0)?.id).toBe(10_000);
    expect(addRules.at(-1)?.id).toBe(14_499);
  });
});
