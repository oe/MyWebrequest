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

function installBrowserMock(options: {
  installedIds: number[];
  permitted: boolean;
  regexSupported?: boolean;
}) {
  const onAdded = eventMock();
  const onRemoved = eventMock();
  const updateDynamicRules = vi.fn(async () => undefined);

  vi.stubGlobal('browser', {
    declarativeNetRequest: {
      getDynamicRules: vi.fn(async () => options.installedIds.map((id) => ({ id }))),
      isRegexSupported: vi.fn(async () => ({
        isSupported: options.regexSupported ?? true,
        reason: options.regexSupported === false ? 'memoryLimitExceeded' : undefined,
      })),
      updateDynamicRules,
    },
    permissions: {
      contains: vi.fn(async () => options.permitted),
      request: vi.fn(async () => options.permitted),
      onAdded,
      onRemoved,
    },
  });

  return {
    onAdded,
    onRemoved,
    updateDynamicRules,
    contains: browser.permissions.contains,
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
      origins: ['*://*.app.example.com/*', 'https://api.example.com/*'],
    };
    expect(runtime.contains).toHaveBeenCalledWith(expected);
    expect(runtime.request).toHaveBeenCalledWith(expected);
  });

  it('does not touch host permissions for a safe block rule', async () => {
    const rule = sampleRules[1];
    expect(rule).toBeDefined();
    if (!rule) return;
    const runtime = installBrowserMock({ installedIds: [], permitted: false });

    await expect(hasRulePermission(rule)).resolves.toBe(true);
    await expect(requestRulePermission(rule)).resolves.toBe(true);
    expect(runtime.contains).not.toHaveBeenCalled();
    expect(runtime.request).not.toHaveBeenCalled();
  });

  it('uses the browser DNR engine to reject an unsupported wildcard expression', async () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;
    installBrowserMock({ installedIds: [], permitted: true, regexSupported: false });

    await expect(checkRuleRegexSupport(rule)).resolves.toEqual({
      isSupported: false,
      reason: 'memoryLimitExceeded',
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
});
