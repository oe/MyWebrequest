import type { Rule } from './model';
import { validateRule } from './validate';
import { compileUrlMatcher } from './url-matcher';
export { compileUrlMatcher, urlFilterToRegExpSource, wildcardToRegExpSource } from './url-matcher';

export type MatchResult =
  | { matched: false; reason: string; reasonCode: 'invalid-rule' | 'url-no-match' | 'unsupported-pattern' }
  | {
      matched: true;
      result: string;
      resultCode?: 'request-blocked' | 'header-operations';
      operationCount?: number;
      captures: string[];
    };

export function matchRule(rule: Rule, candidateUrl: string): MatchResult {
  const validation = validateRule(rule);
  if (!validation.valid) {
    return {
      matched: false,
      reason: validation.errors[0]?.message ?? 'The rule is invalid.',
      reasonCode: 'invalid-rule',
    };
  }

  let captures: string[];
  try {
    const expression = compileUrlMatcher(rule.condition.url, rule.condition.isUrlFilterCaseSensitive);
    const match = expression.matcher(candidateUrl);
    if (!match.find()) {
      return { matched: false, reason: 'The URL does not match this rule.', reasonCode: 'url-no-match' };
    }
    captures = Array.from({ length: expression.groupCount() }, (_, index) => match.group(index + 1) ?? '');
  } catch {
    return {
      matched: false,
      reason: 'This pattern is not supported by the preview engine.',
      reasonCode: 'unsupported-pattern',
    };
  }

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
      if (rule.action.preserveQuery) {
        const networkUrl = candidateUrl.split('#')[0]!;
        const queryIndex = networkUrl.indexOf('?');
        const query = queryIndex < 0 ? '' : networkUrl.slice(queryIndex);
        const fragmentIndex = candidateUrl.indexOf('#');
        const targetFragmentIndex = rule.action.target.indexOf('#');
        const fragment =
          targetFragmentIndex >= 0
            ? rule.action.target.slice(targetFragmentIndex)
            : fragmentIndex >= 0
              ? candidateUrl.slice(fragmentIndex)
              : '';
        return { matched: true, result: rule.action.target.split('#')[0]! + query + fragment, captures };
      }
      if (rule.action.transform) {
        try {
          const target = new URL(candidateUrl);
          target.hostname = rule.action.transform.host;
          return { matched: true, result: target.href, captures };
        } catch {
          return { matched: false, reason: 'Invalid URL', reasonCode: 'url-no-match' };
        }
      }
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
