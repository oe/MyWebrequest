import type { Rule } from './model';
import { validateRule } from './validate';

export type MatchResult =
  { matched: false; reason: string } | { matched: true; result: string; captures: string[] };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function wildcardToRegExpSource(value: string): string {
  return `^${value.split('*').map(escapeRegExp).join('(.*)')}$`;
}

export function matchRule(rule: Rule, candidateUrl: string): MatchResult {
  const validation = validateRule(rule);
  if (!validation.valid) {
    return { matched: false, reason: validation.errors[0]?.message ?? 'The rule is invalid.' };
  }

  let expression: RegExp;
  if (rule.condition.url.kind === 'wildcard') {
    expression = new RegExp(wildcardToRegExpSource(rule.condition.url.value));
  } else if (rule.condition.url.kind === 'regex') {
    expression = new RegExp(rule.condition.url.value);
  } else {
    const filter = rule.condition.url.value;
    if (filter.startsWith('||')) {
      const host = filter.slice(2).replace(/\^$/, '');
      expression = new RegExp(`^https?://(?:[^/]+\\.)?${escapeRegExp(host)}(?:[/:]|$)`);
    } else {
      expression = new RegExp(escapeRegExp(filter).replace(/\\\*/g, '.*'));
    }
  }

  const match = candidateUrl.match(expression);
  if (!match) {
    return { matched: false, reason: 'The URL does not match this rule.' };
  }

  const captures = match.slice(1);
  switch (rule.action.kind) {
    case 'block':
      return { matched: true, result: 'Request blocked', captures };
    case 'upgrade-scheme':
      return { matched: true, result: candidateUrl.replace(/^http:/, 'https:'), captures };
    case 'modify-request-headers':
      return {
        matched: true,
        result: `${rule.action.operations.length} request header operation${rule.action.operations.length === 1 ? '' : 's'}`,
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
