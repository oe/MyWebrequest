import { RE2JS } from 're2js';
import type { Rule } from './model';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function wildcardToRegExpSource(value: string): string {
  return `^${value.split('*').map(escapeRegExp).join('(.*)')}$`;
}

const urlSeparatorSource = '(?:[^A-Za-z0-9_.%\\-]|$)';

export function urlFilterToRegExpSource(value: string): string {
  let filter = value;
  let prefix = '';
  let suffix = '';

  if (filter.startsWith('||')) {
    filter = filter.slice(2);
    prefix = '^[A-Za-z][A-Za-z0-9+.-]*://(?:[^./?#:]+\\.)*';
  } else if (filter.startsWith('|')) {
    filter = filter.slice(1);
    prefix = '^';
  }

  if (filter.endsWith('|')) {
    filter = filter.slice(0, -1);
    suffix = '$';
  }

  const body = [...filter]
    .map((character) => {
      if (character === '*') return '.*';
      if (character === '^') return urlSeparatorSource;
      return escapeRegExp(character);
    })
    .join('');

  return `${prefix}${body}${suffix}`;
}

// Bounded cache shared by diagnostics and previews. DNR defaults to case-insensitive
// matching for both urlFilter and regexFilter. RE2 avoids JS backtracking stalls.
const matchers = new Map<string, RE2JS>();

export function compileUrlMatcher(condition: Rule['condition']['url']): RE2JS {
  const key = `${condition.kind}:${condition.value}`;
  const cached = matchers.get(key);
  if (cached) return cached;
  const source =
    condition.kind === 'wildcard'
      ? wildcardToRegExpSource(condition.value)
      : condition.kind === 'regex'
        ? condition.value
        : urlFilterToRegExpSource(condition.value);
  const matcher = RE2JS.compile(source, RE2JS.CASE_INSENSITIVE);
  if (matchers.size >= 1_000) matchers.delete(matchers.keys().next().value!);
  matchers.set(key, matcher);
  return matcher;
}
