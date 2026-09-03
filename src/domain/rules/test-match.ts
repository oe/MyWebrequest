import type { Rule } from './model';
import { validateRule } from './validate';

export type MatchResult =
  | { matched: false; reason: string; reasonCode: 'invalid-rule' | 'url-no-match' }
  | {
      matched: true;
      result: string;
      resultCode?: 'request-blocked' | 'header-operations';
      operationCount?: number;
      captures: string[];
    };

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

export function matchRule(rule: Rule, candidateUrl: string): MatchResult {
  const validation = validateRule(rule);
  if (!validation.valid) {
    return {
      matched: false,
      reason: validation.errors[0]?.message ?? 'The rule is invalid.',
      reasonCode: 'invalid-rule',
    };
  }

  let expression: RegExp;
  if (rule.condition.url.kind === 'wildcard') {
    expression = new RegExp(wildcardToRegExpSource(rule.condition.url.value));
  } else if (rule.condition.url.kind === 'regex') {
    expression = new RegExp(rule.condition.url.value);
  } else {
    expression = new RegExp(urlFilterToRegExpSource(rule.condition.url.value));
  }

  const match = candidateUrl.match(expression);
  if (!match) {
    return { matched: false, reason: 'The URL does not match this rule.', reasonCode: 'url-no-match' };
  }

  const captures = match.slice(1);
  switch (rule.action.kind) {
    case 'block':
      return { matched: true, result: 'Request blocked', resultCode: 'request-blocked', captures };
    case 'upgrade-scheme':
      return { matched: true, result: candidateUrl.replace(/^http:/, 'https:'), captures };
    case 'modify-request-headers':
      return {
        matched: true,
        result: `${rule.action.operations.length} request header operation${rule.action.operations.length === 1 ? '' : 's'}`,
        resultCode: 'header-operations',
        operationCount: rule.action.operations.length,
        captures,
      };
    case 'redirect':
      return {
        matched: true,
        result: rule.action.target.replace(
          /\$(\d+)/g,
          (_, index: string) => captures[Number(index) - 1] ?? '',
        ),
        captures,
      };
  }
}
