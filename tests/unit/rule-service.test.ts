import { describe, expect, it } from 'vitest';

import {
  createRule,
  createStarterRule,
  duplicateRule,
  permissionOriginsFromMatch,
  removeRule,
  restoreRule,
  upsertRule,
} from '@/application/rule-service';
import { createEmptyState, sampleRules } from '@/domain/rules/fixtures';
import { requiredPermissionOrigins } from '@/domain/rules/permissions';
import { validateRule } from '@/domain/rules/validate';

describe('rule service', () => {
  it('derives a narrow optional permission from a concrete match', () => {
    expect(permissionOriginsFromMatch('https://api.example.com/v1/*')).toEqual(['https://api.example.com/*']);
  });

  it('strips ports because extension match patterns are host-scoped', () => {
    expect(permissionOriginsFromMatch('http://localhost:4174/probe*')).toEqual(['http://localhost/*']);
    expect(permissionOriginsFromMatch('https://*.example.com:8443/path/*')).toEqual([
      'https://*.example.com/*',
    ]);
  });

  it('expands wildcard schemes into requestable optional host patterns', () => {
    expect(permissionOriginsFromMatch('*://*.example.com/*')).toEqual([
      'http://*.example.com/*',
      'https://*.example.com/*',
    ]);
    expect(permissionOriginsFromMatch('||example.com^')).toEqual([
      'http://*.example.com/*',
      'https://*.example.com/*',
    ]);
    expect(permissionOriginsFromMatch('http://example.com/*')).toEqual(['http://example.com/*']);
  });

  it('requires no host access for safe DNR actions', () => {
    const block = sampleRules[1];
    expect(block).toBeDefined();
    if (!block) return;

    expect(requiredPermissionOrigins(block)).toEqual([]);
  });

  it('requests both request and initiator origins for subresource redirects', () => {
    const redirect = sampleRules[0];
    expect(redirect).toBeDefined();
    if (!redirect) return;

    expect(requiredPermissionOrigins({ ...redirect, permissionOrigins: ['*://api.example.com/*'] })).toEqual([
      'http://*.app.example.com/*',
      'http://api.example.com/*',
      'https://*.app.example.com/*',
      'https://api.example.com/*',
    ]);
  });

  it('rejects an unsafe subresource action without a bounded initiator domain', () => {
    const redirect = sampleRules[0];
    expect(redirect).toBeDefined();
    if (!redirect) return;
    const { initiatorDomains: ignored, ...condition } = redirect.condition;
    void ignored;

    const result = validateRule({
      ...redirect,
      condition,
    });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'initiator-permission-required', field: 'initiators' }),
    );
  });

  it('creates a disabled site-scoped rule', () => {
    const rule = createRule('https://docs.example.com');
    expect(rule.enabled).toBe(false);
    expect(rule.condition.url.value).toBe('https://docs.example.com/*');
    expect(rule.permissionOrigins).toEqual(['https://docs.example.com/*']);
  });

  it.each([
    ['block-analytics', 'block', '||analytics.example.com^', ['xmlhttprequest', 'ping']],
    ['redirect-local', 'redirect', 'https://api.example.com/v1/*', ['xmlhttprequest']],
    ['remove-referrer', 'modify-request-headers', 'https://images.example.com/*', ['image']],
  ] as const)('creates a disabled and valid %s starter', (kind, action, match, resourceTypes) => {
    const rule = createStarterRule(kind, `Starter ${kind}`);
    expect(rule).toMatchObject({
      name: `Starter ${kind}`,
      enabled: false,
      action: { kind: action },
      condition: { url: { value: match }, resourceTypes },
    });
    expect(validateRule(rule)).toMatchObject({ valid: true, errors: [] });
  });

  it('adds and removes a rule without leaving a dangling order entry', () => {
    const rule = createRule();
    const added = upsertRule(createEmptyState(), rule);
    expect(added.order).toEqual([rule.id]);
    expect(added.rules[rule.id]).toBeDefined();

    const removed = removeRule(added, rule.id);
    expect(removed.order).toEqual([]);
    expect(removed.rules[rule.id]).toBeUndefined();
  });

  it('duplicates disabled with a fresh rule identity and restores deletion at its original position', () => {
    const original = createRule('https://docs.example.com');
    const initial = upsertRule(createEmptyState(), original);
    const duplicated = duplicateRule(initial, original, 'Copy of docs rule');

    expect(duplicated.rule).toMatchObject({ name: 'Copy of docs rule', enabled: false });
    expect(duplicated.rule.id).not.toBe(original.id);
    expect(duplicated.rule.dnrId).not.toBe(original.dnrId);

    const removed = removeRule(duplicated.state, original.id);
    const restored = restoreRule(removed, original, 1);
    expect(restored.order[1]).toBe(original.id);
    expect(restored.rules[original.id]).toEqual(original);
  });
});
