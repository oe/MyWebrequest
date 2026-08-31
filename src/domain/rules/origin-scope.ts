import type { Rule } from './model';

function patternMatchesOrigin(pattern: string, origin: string): boolean {
  const match = /^(\*|https?):\/\/(\*\.)?([^/]+)\/\*$/.exec(pattern);
  if (!match) return false;

  try {
    const url = new URL(origin);
    const [, scheme, wildcard, host] = match;
    const schemeMatches = scheme === '*' || `${scheme}:` === url.protocol;
    const hostMatches =
      host === '*'
        ? true
        : wildcard
          ? url.hostname === host || url.hostname.endsWith(`.${host}`)
          : url.hostname === host;
    return schemeMatches && hostMatches;
  } catch {
    return false;
  }
}

export function ruleMatchesOrigin(rule: Rule, origin: string): boolean {
  return rule.permissionOrigins.some((pattern) => patternMatchesOrigin(pattern, origin));
}
