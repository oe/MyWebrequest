import { describe, expect, it } from 'vitest';

import { sampleRules } from '@/domain/rules/fixtures';
import { createTranslator } from '@/ui/i18n/core';
import { ruleMatchesQuery } from '@/ui/rules/filter-rules';

describe('rule filtering', () => {
  const t = createTranslator('en');
  const redirect = sampleRules[0];

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
});
