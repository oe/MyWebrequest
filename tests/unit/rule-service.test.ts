import { describe, expect, it } from 'vitest';

import {
  createRule,
  duplicateRule,
  permissionOriginsFromMatch,
  removeRule,
  restoreRule,
  upsertRule,
} from '@/application/rule-service';
import { createEmptyState } from '@/domain/rules/fixtures';

describe('rule service', () => {
  it('derives a narrow optional permission from a concrete match', () => {
    expect(permissionOriginsFromMatch('https://api.example.com/v1/*')).toEqual(['https://api.example.com/*']);
  });

  it('preserves legacy match-pattern schemes and wildcard subdomains', () => {
    expect(permissionOriginsFromMatch('*://*.example.com/*')).toEqual(['*://*.example.com/*']);
    expect(permissionOriginsFromMatch('http://example.com/*')).toEqual(['http://example.com/*']);
  });

  it('creates a disabled site-scoped rule', () => {
    const rule = createRule('https://docs.example.com');
    expect(rule.enabled).toBe(false);
    expect(rule.condition.url.value).toBe('https://docs.example.com/*');
    expect(rule.permissionOrigins).toEqual(['https://docs.example.com/*']);
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
