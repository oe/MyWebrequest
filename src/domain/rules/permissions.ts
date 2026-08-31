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
