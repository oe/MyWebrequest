import { describe, expect, it } from 'vitest';

import { sampleRules } from '@/domain/rules/fixtures';
import { matchRule, urlFilterToRegExpSource, wildcardToRegExpSource } from '@/domain/rules/test-match';

describe('matchRule', () => {
  it('keeps legacy wildcard redirects working in previews', () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;

    expect(matchRule(rule, 'https://api.example.com/v1/users')).toEqual({
      matched: true,
      result: 'http://localhost:3000/v1/users',
      captures: ['users'],
    });
  });

  it('maps legacy wildcard captures to $1, $2, and later destination references in order', () => {
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

  it('escapes punctuation when compiling legacy wildcards', () => {
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

it('uses the browser default case-insensitive semantics for every match syntax', () => {
  const base = sampleRules[0]!;
  for (const url of [
    { kind: 'url-filter' as const, value: '|https://example.com/lower|' },
    { kind: 'wildcard' as const, value: 'https://example.com/*' },
    { kind: 'regex' as const, value: '^https://example\\.com/lower$' },
  ]) {
    expect(
      matchRule(
        { ...base, condition: { ...base.condition, url }, action: { kind: 'block' } },
        'https://example.com/LOWER',
      ).matched,
    ).toBe(true);
  }
});

it('handles nested repetition without backtracking and respects explicit regex flags', () => {
  const base = sampleRules[0]!;
  const rule = {
    ...base,
    condition: { ...base.condition, url: { kind: 'regex' as const, value: '^(a+)+$' } },
    action: { kind: 'block' as const },
  };
  expect(matchRule(rule, `${'a'.repeat(10_000)}!`).matched).toBe(false);
  expect(
    matchRule(
      { ...rule, condition: { ...rule.condition, url: { kind: 'regex', value: '(?-i)^lower$' } } },
      'lower',
    ).matched,
  ).toBe(true);
  expect(
    matchRule(
      { ...rule, condition: { ...rule.condition, url: { kind: 'regex', value: '(?-i)^lower$' } } },
      'LOWER',
    ).matched,
  ).toBe(false);
  expect(
    matchRule({ ...rule, condition: { ...rule.condition, url: { kind: 'regex', value: '(a)\\1' } } }, 'aa'),
  ).toMatchObject({ matched: false, reasonCode: 'invalid-rule' });
});
