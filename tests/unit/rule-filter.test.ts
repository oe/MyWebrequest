import { describe, expect, it } from 'vitest';

import { sampleRules } from '@/domain/rules/fixtures';
import { createTranslator } from '@/ui/i18n/core';
import { ruleMatchesFilters, ruleMatchesQuery, ruleMatchesRuleList } from '@/ui/rules/filter-rules';

describe('rule filtering', () => {
  const t = createTranslator('en');
  const redirect = sampleRules[0];
  const block = sampleRules[1];
  const imageHeader = sampleRules[2];

  it('matches name, localized action, and URL without case sensitivity', () => {
    expect(redirect).toBeDefined();
    if (!redirect) return;

    expect(ruleMatchesQuery(redirect, 'mirror', t)).toBe(true);
    expect(ruleMatchesQuery(redirect, 'REDIRECT', t)).toBe(true);
    expect(ruleMatchesQuery(redirect, 'api.example.com', t)).toBe(true);
  });

  it('treats an empty query as visible and rejects unrelated text', () => {
    expect(redirect).toBeDefined();
    if (!redirect) return;

    expect(ruleMatchesQuery(redirect, '   ', t)).toBe(true);
    expect(ruleMatchesQuery(redirect, 'analytics beacon', t)).toBe(false);
  });

  it('filters by action and resource type', () => {
    expect(block).toBeDefined();
    expect(imageHeader).toBeDefined();
    if (!block || !imageHeader) return;

    expect(ruleMatchesFilters(block, 'block', 'ping')).toBe(true);
    expect(ruleMatchesFilters(block, 'redirect', 'ping')).toBe(false);
    expect(ruleMatchesFilters(imageHeader, 'modify-request-headers', 'image')).toBe(true);
    expect(ruleMatchesFilters(imageHeader, 'modify-request-headers', 'script')).toBe(false);
  });

  it('treats an omitted resource type condition as matching every resource filter', () => {
    expect(redirect).toBeDefined();
    if (!redirect) return;

    expect(ruleMatchesFilters(redirect, 'all', 'script')).toBe(true);
  });

  it('combines search, action, and resource filters', () => {
    expect(block).toBeDefined();
    if (!block) return;

    expect(
      ruleMatchesRuleList(block, { query: 'analytics', action: 'block', resourceType: 'xmlhttprequest' }, t),
    ).toBe(true);
    expect(
      ruleMatchesRuleList(block, { query: 'analytics', action: 'block', resourceType: 'image' }, t),
    ).toBe(false);
  });
});
