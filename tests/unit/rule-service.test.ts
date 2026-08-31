import { describe, expect, it } from 'vitest';

import { createRule, permissionOriginsFromMatch, removeRule, upsertRule } from '@/application/rule-service';
import { createEmptyState } from '@/domain/rules/fixtures';

describe('rule service', () => {
  it('derives a narrow optional permission from a concrete match', () => {
    expect(permissionOriginsFromMatch('https://api.example.com/v1/*')).toEqual(['https://api.example.com/*']);
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
});
