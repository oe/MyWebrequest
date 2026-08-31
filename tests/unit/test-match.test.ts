import { describe, expect, it } from 'vitest';

import { sampleRules } from '@/src/domain/rules/fixtures';
import { matchRule, wildcardToRegExpSource } from '@/src/domain/rules/test-match';

describe('matchRule', () => {
  it('captures a wildcard and produces the redirect preview', () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;

    expect(matchRule(rule, 'https://api.example.com/v1/users')).toEqual({
      matched: true,
      result: 'http://localhost:3000/v1/users',
      captures: ['users'],
    });
  });

  it('explains a URL that does not match', () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;

    expect(matchRule(rule, 'https://example.org/v1/users')).toEqual({
      matched: false,
      reason: 'The URL does not match this rule.',
    });
  });

  it('escapes punctuation when compiling wildcards', () => {
    expect(wildcardToRegExpSource('https://example.com/a?value=*')).toBe(
      '^https://example\\.com/a\\?value=(.*)$',
    );
  });
});
