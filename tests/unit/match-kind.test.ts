import { describe, expect, it } from 'vitest';

import {
  convertedMatchValue,
  guidanceForMatch,
  regexWithWildcardCaptures,
  suggestedMatchKind,
  suggestedTestUrls,
} from '@/ui/rules/match-kind';

describe('match syntax assistance', () => {
  it('suggests regex only for a strongly anchored expression', () => {
    const expression = '^https://api\\.example\\.com/(.*)$';

    expect(suggestedMatchKind(expression, 'url-filter')).toBe('regex');
    expect(suggestedMatchKind(expression, 'wildcard')).toBe('regex');
    expect(suggestedMatchKind(expression, 'regex')).toBeNull();
    expect(suggestedMatchKind('https://example.com/*', 'url-filter')).toBeNull();
  });

  it('converts browser URL filters into equivalent regular expressions', () => {
    const expression = new RegExp(convertedMatchValue('||example.com^', 'url-filter', 'regex'));

    expect(expression.test('https://assets.example.com/app.js')).toBe(true);
    expect(expression.test('https://example.company/app.js')).toBe(false);
  });

  it('preserves absolute URL filters when switching to the simple wildcard mode', () => {
    expect(convertedMatchValue('https://example.com/*', 'url-filter', 'wildcard')).toBe(
      'https://example.com/*',
    );
  });

  it('anchors simple wildcard patterns when switching to URL-filter mode', () => {
    expect(convertedMatchValue('https://example.com/*', 'wildcard', 'url-filter')).toBe(
      '|https://example.com/*|',
    );
  });

  it('uses safe examples when two modes cannot be converted without changing intent', () => {
    expect(convertedMatchValue('^https://example\\.com/(.*)$', 'regex', 'wildcard')).toBe(
      'https://example.com/*',
    );
    expect(convertedMatchValue('^https://example\\.com/(.*)$', 'regex', 'url-filter')).toBe('||example.com^');
  });

  it('turns every wildcard into a redirect capture group', () => {
    expect(regexWithWildcardCaptures('https://example.com/*')).toBe('^https://example\\.com/(.*)$');
  });

  it('explains the effective scope of each matching style', () => {
    expect(guidanceForMatch('url-filter', '||example.com^')).toEqual({ kind: 'url-filter-domain' });
    expect(guidanceForMatch('url-filter', '|https://example.com/app.js|')).toEqual({
      kind: 'url-filter-exact',
    });
    expect(guidanceForMatch('url-filter', 'https://example.com/assets/*')).toEqual({
      kind: 'url-filter-path',
    });
    expect(guidanceForMatch('wildcard', 'https://example.com/*/file/*')).toEqual({
      kind: 'wildcard',
      captureCount: 2,
    });
    expect(guidanceForMatch('regex', '^https://example\\.com/(.*)$')).toEqual({
      kind: 'regex-anchored',
    });
    expect(guidanceForMatch('regex', 'example\\.com')).toEqual({ kind: 'regex-unanchored' });
  });

  it('offers verified matching and non-matching URLs for common patterns', () => {
    expect(suggestedTestUrls('url-filter', '||example.com^', '')).toEqual({
      matching: 'https://example.com/example',
      nonMatching: 'https://not-matched.invalid/request-orbit-check',
    });
    expect(suggestedTestUrls('wildcard', 'https://api.example.com/v1/*', '')).toEqual({
      matching: 'https://api.example.com/v1/users/42',
      nonMatching: 'https://not-matched.invalid/request-orbit-check',
    });
  });
});
