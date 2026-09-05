import type { Rule } from '@/domain/rules/model';
import {
  compileUrlMatcher,
  urlFilterToRegExpSource,
  wildcardToRegExpSource,
} from '@/domain/rules/test-match';

export type MatchKind = Rule['condition']['url']['kind'];

export type MatchGuidance =
  | { kind: 'url-filter-domain' }
  | { kind: 'url-filter-exact' }
  | { kind: 'url-filter-path' }
  | { kind: 'url-filter-text' }
  | { kind: 'wildcard'; captureCount: number }
  | { kind: 'regex-anchored' }
  | { kind: 'regex-unanchored' };

export type SuggestedTestUrls = {
  matching: string | undefined;
  nonMatching: string | undefined;
};

const DEFAULT_MATCH_CANDIDATES = [
  'https://example.com/',
  'https://api.example.com/v1/projects/alpha',
  'https://example.com/assets/app.js',
];

const DEFAULT_NON_MATCH_CANDIDATES = [
  'https://not-matched.invalid/request-orbit-check',
  'http://not-matched.invalid/request-orbit-check',
  'https://example.company/request-orbit-check',
];

export function guidanceForMatch(kind: MatchKind, value: string): MatchGuidance {
  const pattern = value.trim();
  if (kind === 'wildcard') {
    return { kind, captureCount: [...pattern].filter((character) => character === '*').length };
  }
  if (kind === 'regex') {
    return { kind: pattern.startsWith('^') && pattern.endsWith('$') ? 'regex-anchored' : 'regex-unanchored' };
  }
  if (pattern.startsWith('||')) return { kind: 'url-filter-domain' };
  if (pattern.startsWith('|') && pattern.endsWith('|')) return { kind: 'url-filter-exact' };
  if (pattern.includes('*')) return { kind: 'url-filter-path' };
  return { kind: 'url-filter-text' };
}

function patternMatches(kind: MatchKind, value: string, candidate: string): boolean {
  try {
    return compileUrlMatcher({ kind, value }).test(candidate);
  } catch {
    return false;
  }
}

function candidateFromPattern(kind: MatchKind, value: string): string | undefined {
  const pattern = value.trim();
  if (kind === 'url-filter' && pattern.startsWith('||')) {
    const host = pattern.slice(2).match(/^[A-Za-z0-9.-]+/)?.[0];
    return host ? `https://${host}/example` : undefined;
  }
  if (kind === 'regex') return undefined;

  const withoutAnchors = pattern.replace(/^\|/, '').replace(/\|$/, '');
  if (!/^https?:\/\//.test(withoutAnchors)) return undefined;
  let captureIndex = 0;
  return withoutAnchors
    .replace(/\*/g, () => (captureIndex++ === 0 ? 'users/42' : 'sample'))
    .replace(/\^/g, '/');
}

export function suggestedTestUrls(kind: MatchKind, value: string, currentTestUrl: string): SuggestedTestUrls {
  const candidates = [currentTestUrl, candidateFromPattern(kind, value), ...DEFAULT_MATCH_CANDIDATES].filter(
    (candidate): candidate is string => Boolean(candidate),
  );
  const uniqueCandidates = [...new Set(candidates)];
  return {
    matching: uniqueCandidates.find((candidate) => patternMatches(kind, value, candidate)),
    nonMatching: DEFAULT_NON_MATCH_CANDIDATES.find((candidate) => !patternMatches(kind, value, candidate)),
  };
}

export function suggestedMatchKind(value: string, currentKind: MatchKind): MatchKind | null {
  if (currentKind === 'regex') return null;

  const candidate = value.trim();
  return candidate.length > 2 && candidate.startsWith('^') && candidate.endsWith('$') ? 'regex' : null;
}

export function convertedMatchValue(value: string, currentKind: MatchKind, nextKind: MatchKind): string {
  if (currentKind === nextKind) return value;

  if (nextKind === 'regex') {
    return currentKind === 'url-filter' ? urlFilterToRegExpSource(value) : wildcardToRegExpSource(value);
  }

  if (nextKind === 'wildcard') {
    return currentKind === 'url-filter' && /^https?:\/\//.test(value) ? value : 'https://example.com/*';
  }

  return currentKind === 'wildcard' ? `|${value}|` : '||example.com^';
}

export function regexWithWildcardCaptures(value: string): string {
  return wildcardToRegExpSource(value);
}
