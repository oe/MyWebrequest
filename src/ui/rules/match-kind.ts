import type { Rule } from '@/domain/rules/model';
import { urlFilterToRegExpSource, wildcardToRegExpSource } from '@/domain/rules/test-match';

export type MatchKind = Rule['condition']['url']['kind'];

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
