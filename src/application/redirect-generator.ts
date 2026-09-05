import type { Rule } from '@/domain/rules/model';
import { validateRule } from '@/domain/rules/validate';

export type RedirectGeneration =
  | { ok: true; rule: Rule; source: string; target: string }
  | { ok: false; error: 'url' | 'fragment' | 'same' | 'placeholder' | 'long' };

export function generateRedirectRule(base: Rule, from: string, to: string): RedirectGeneration {
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
  if (source.hash) return { ok: false, error: 'fragment' };
  const targetWithoutHash = new URL(target.href);
  targetWithoutHash.hash = '';
  if (source.href === targetWithoutHash.href) return { ok: false, error: 'same' };
  if (/\$\d/.test(target.href)) return { ok: false, error: 'placeholder' };
  const escaped = source.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule: Rule = {
    ...base,
    name: `${source.hostname} → ${target.hostname}`.slice(0, 100),
    enabled: false,
    condition: { url: { kind: 'regex', value: `(?-i)^${escaped}$` }, resourceTypes: ['main_frame'] },
    action: { kind: 'redirect', target: target.href },
    permissionOrigins: [`${source.protocol}//${source.hostname}/*`],
    migrationState: 'none',
  };
  if (!validateRule(rule).valid) return { ok: false, error: 'long' };
  return { ok: true, rule, source: source.href, target: target.href };
}
