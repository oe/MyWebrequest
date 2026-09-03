import { describe, expect, it } from 'vitest';

import { sampleRules } from '@/domain/rules/fixtures';
import { matchRule, urlFilterToRegExpSource, wildcardToRegExpSource } from '@/domain/rules/test-match';

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

  it('maps wildcard captures to $1, $2, and later destination references in order', () => {
    const base = sampleRules[0];
    expect(base).toBeDefined();
    if (!base) return;

    const rule = {
      ...base,
      condition: {
        ...base.condition,
        url: { kind: 'wildcard' as const, value: 'https://example.com/*/file/*' },
      },
      action: { kind: 'redirect' as const, target: 'https://new.example.com/$1/$2' },
    };

    expect(matchRule(rule, 'https://example.com/users/file/42')).toMatchObject({
      matched: true,
      result: 'https://new.example.com/users/42',
      captures: ['users', '42'],
    });
  });

  it('explains a URL that does not match', () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;

    expect(matchRule(rule, 'https://example.org/v1/users')).toEqual({
      matched: false,
      reason: 'The URL does not match this rule.',
      reasonCode: 'url-no-match',
    });
  });

  it('escapes punctuation when compiling wildcards', () => {
    expect(wildcardToRegExpSource('https://example.com/a?value=*')).toBe(
      '^https://example\\.com/a\\?value=(.*)$',
    );
  });

  it('matches a DNR domain anchor only at the requested domain boundary', () => {
    const expression = new RegExp(urlFilterToRegExpSource('||example.com^'));
    expect(expression.test('https://example.com/')).toBe(true);
    expect(expression.test('http://assets.example.com/app.js')).toBe(true);
    expect(expression.test('https://example.company/')).toBe(false);
    expect(expression.test('https://notexample.com/')).toBe(false);
  });

  it('supports URL anchors, separator tokens, and URL-filter wildcards in previews', () => {
    const exact = new RegExp(urlFilterToRegExpSource('|https://example.com/app.js|'));
    expect(exact.test('https://example.com/app.js')).toBe(true);
    expect(exact.test('https://example.com/app.js?v=1')).toBe(false);

    const path = new RegExp(urlFilterToRegExpSource('https://example.com/assets/*'));
    expect(path.test('https://example.com/assets/app.js')).toBe(true);
    expect(path.test('https://example.com/images/app.js')).toBe(false);
  });
});
