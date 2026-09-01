import type { Rule } from './model';

const navigationResourceTypes = new Set(['main_frame', 'sub_frame']);

function permissionPatterns(scheme: string, host: string): string[] {
  if (scheme === '*') return [`http://${host}/*`, `https://${host}/*`];
  return [`${scheme}://${host}/*`];
}

function normalizeMatchPatternHost(scheme: string, host: string): string | null {
  if (host === '*') return host;

  const wildcard = host.startsWith('*.');
  const candidate = wildcard ? host.slice(2) : host;
  try {
    const parsed = new URL(`${scheme === '*' ? 'https' : scheme}://${candidate}/`);
    return `${wildcard ? '*.' : ''}${parsed.hostname}`;
  } catch {
    return null;
  }
}

export function permissionOriginsFromMatch(value: string): string[] {
  if (value.startsWith('||')) {
    const host = value.slice(2).replace(/\^.*$/, '').replace(/^\*\./, '');
    return host ? permissionPatterns('*', `*.${host}`) : [];
  }

  const matchPattern = /^(\*|https?):\/\/([^/]+)(?:\/|$)/.exec(value);
  if (matchPattern) {
    const scheme = matchPattern[1];
    const host = scheme && matchPattern[2] ? normalizeMatchPatternHost(scheme, matchPattern[2]) : null;
    if (
      scheme &&
      host &&
      !host.includes('{') &&
      (host === '*' || !host.includes('*') || host.startsWith('*.'))
    ) {
      return permissionPatterns(scheme, host);
    }
  }

  const normalized = value
    .replace(/^\^/, '')
    .replace(/\\\//g, '/')
    .replace(/\\\./g, '.')
    .replace(/^https\?:/, 'https:');

  try {
    const url = new URL(normalized.replace(/[(*].*$/, ''));
    return [`${url.protocol}//${url.hostname}/*`];
  } catch {
    return [];
  }
}

export function requiresInitiatorPermission(rule: Rule): boolean {
  if (rule.action.kind !== 'redirect' && rule.action.kind !== 'modify-request-headers') return false;
  const resourceTypes = rule.condition.resourceTypes;
  return !resourceTypes?.length || resourceTypes.some((type) => !navigationResourceTypes.has(type));
}

export function requiredPermissionOrigins(rule: Rule): string[] {
  if (rule.action.kind === 'block' || rule.action.kind === 'upgrade-scheme') return [];

  // Older stored rules may still contain Chrome-style `*://` patterns. They
  // remain valid match patterns, but cannot be requested from our manifest's
  // scheme-specific optional host permissions, so normalize them at runtime.
  const origins = rule.permissionOrigins.flatMap(permissionOriginsFromMatch);
  if (requiresInitiatorPermission(rule)) {
    for (const domain of rule.condition.initiatorDomains ?? []) {
      origins.push(...permissionPatterns('*', `*.${domain.toLowerCase()}`));
    }
  }
  return [...new Set(origins)].sort();
}
