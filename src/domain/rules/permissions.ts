import type { Rule } from './model';

const navigationResourceTypes = new Set(['main_frame', 'sub_frame']);

export function permissionOriginsFromMatch(value: string): string[] {
  if (value.startsWith('||')) {
    const host = value.slice(2).replace(/\^.*$/, '').replace(/^\*\./, '');
    return host ? [`*://*.${host}/*`] : [];
  }

  const matchPattern = /^(\*|https?):\/\/([^/]+)(?:\/|$)/.exec(value);
  if (matchPattern) {
    const scheme = matchPattern[1];
    const host = matchPattern[2];
    if (
      scheme &&
      host &&
      !host.includes('{') &&
      (host === '*' || !host.includes('*') || host.startsWith('*.'))
    ) {
      return [`${scheme}://${host}/*`];
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

  const origins = [...rule.permissionOrigins];
  if (requiresInitiatorPermission(rule)) {
    for (const domain of rule.condition.initiatorDomains ?? []) {
      origins.push(`*://*.${domain.toLowerCase()}/*`);
    }
  }
  return [...new Set(origins)].sort();
}
