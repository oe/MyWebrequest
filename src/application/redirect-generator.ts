import type { Rule } from '@/domain/rules/model';
import { validateRule } from '@/domain/rules/validate';

export type RedirectScope = 'exact' | 'path' | 'host';
export type RedirectGeneration =
  | { ok: true; rule: Rule; source: string; target: string; hostAvailable: boolean }
  | {
      ok: false;
      error: 'url' | 'fragment' | 'same' | 'placeholder' | 'long' | 'hostUnavailable' | 'targetQuery';
    };

export function generateRedirectRule(
  base: Rule,
  from: string,
  to: string,
  scope: RedirectScope = 'exact',
): RedirectGeneration {
  let source: URL;
  let target: URL;
  try {
    source = new URL(from.trim());
    target = new URL(to.trim());
    if (
      [source, target].some(
        (url) => !['http:', 'https:'].includes(url.protocol) || url.username || url.password,
      )
    ) {
      return { ok: false, error: 'url' };
    }
  } catch {
    return { ok: false, error: 'url' };
  }
  if (scope !== 'path' && source.href.includes('#')) return { ok: false, error: 'fragment' };
  if (scope === 'path' && target.href.split('#')[0]!.includes('?'))
    return { ok: false, error: 'targetQuery' };
  if (scope === 'path') {
    source.search = '';
    source.hash = '';
  }
  const targetWithoutHash = new URL(target.href);
  targetWithoutHash.hash = '';
  if (source.href === targetWithoutHash.href) return { ok: false, error: 'same' };
  if (/\$\d/.test(target.href)) return { ok: false, error: 'placeholder' };
  const hostAvailable =
    source.hostname !== target.hostname &&
    source.protocol === target.protocol &&
    source.port === target.port &&
    source.pathname === target.pathname &&
    source.search === target.search &&
    !target.href.includes('#') &&
    !target.hostname.includes(':');
  if (scope === 'host' && !hostAvailable) return { ok: false, error: 'hostUnavailable' };
  const escaped = source.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // DNR filter tokens cannot represent literal * or | characters. Keep exact semantics on fallback.
  const url: Rule['condition']['url'] =
    scope === 'host'
      ? { kind: 'url-filter', value: `|${source.origin}/` }
      : scope === 'path'
        ? { kind: 'regex', value: `^${escaped}(?:\\?[^#]*)?(?:#.*)?$` }
        : /[*^|]/.test(source.href)
          ? { kind: 'regex', value: `(?-i)^${escaped}$` }
          : { kind: 'url-filter', value: `|${source.href}|` };
  const rule: Rule = {
    ...base,
    name: `${source.hostname} → ${target.hostname}`.slice(0, 100),
    enabled: false,
    condition: { url, isUrlFilterCaseSensitive: true, resourceTypes: ['main_frame'] },
    action: {
      kind: 'redirect',
      target: target.href,
      ...(scope === 'path' ? { preserveQuery: true } : {}),
      ...(scope === 'host' ? { transform: { host: target.hostname } } : {}),
    },
    redirectBuilder: { source: source.href, target: target.href, scope },
    permissionOrigins: [`${source.protocol}//${source.hostname}/*`],
    migrationState: 'none',
  };
  if (!validateRule(rule).valid) return { ok: false, error: 'long' };
  return { ok: true, rule, source: source.href, target: target.href, hostAvailable };
}

// Metadata is a hint, never authority: advanced edits must not be silently overwritten.
export function redirectBuilderState(rule: Rule): Rule['redirectBuilder'] | null {
  if (rule.action.kind !== 'redirect' || rule.migrationState !== 'none') return null;
  if (
    rule.condition.resourceTypes?.length !== 1 ||
    rule.condition.resourceTypes[0] !== 'main_frame' ||
    rule.condition.requestMethods?.length ||
    rule.condition.initiatorDomains?.length
  )
    return null;
  let hint = rule.redirectBuilder;
  if (!hint && !rule.action.transform) {
    const { kind, value } = rule.condition.url;
    let source: string | undefined;
    if (
      kind === 'url-filter' &&
      rule.condition.isUrlFilterCaseSensitive &&
      /^\|https?:\/\/[^*^|]+\|$/.test(value)
    ) {
      source = value.slice(1, -1);
    } else if (kind === 'regex' && value.startsWith('(?-i)^') && value.endsWith('$')) {
      source = value.slice(6, -1).replace(/\\([.*+?^${}()|[\]\\])/g, '$1');
      if (`(?-i)^${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$` !== value) return null;
    }
    if (source) hint = { source, target: rule.action.target, scope: 'exact' };
  }
  if (!hint) return null;
  const generated = generateRedirectRule(rule, hint.source, hint.target, hint.scope);
  if (!generated.ok) return null;
  const expected = generated.rule;
  const oldExact = !rule.redirectBuilder && rule.condition.url.kind === 'regex' && hint.scope === 'exact';
  if (
    !oldExact &&
    (JSON.stringify(expected.condition.url) !== JSON.stringify(rule.condition.url) ||
      expected.condition.isUrlFilterCaseSensitive !== rule.condition.isUrlFilterCaseSensitive)
  )
    return null;
  if (
    rule.action.target !== hint.target ||
    Boolean(rule.action.preserveQuery) !== (hint.scope === 'path') ||
    JSON.stringify(rule.action.transform) !==
      JSON.stringify(expected.action.kind === 'redirect' ? expected.action.transform : undefined)
  )
    return null;
  if (JSON.stringify(rule.permissionOrigins) !== JSON.stringify(expected.permissionOrigins)) return null;
  return hint;
}
