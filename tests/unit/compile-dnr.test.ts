import { describe, expect, it } from 'vitest';

import { compileDnrRule } from '@/src/domain/rules/compile-dnr';
import { sampleRules } from '@/src/domain/rules/fixtures';

describe('compileDnrRule', () => {
  it('compiles a wildcard redirect to a DNR regex substitution', () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;

    const compiled = compileDnrRule(rule);
    expect(compiled).toEqual({
      ok: true,
      rule: {
        id: 1001,
        priority: 20,
        condition: { regexFilter: '^https://api\\.example\\.com/v1/(.*)$' },
        action: {
          type: 'redirect',
          redirect: { regexSubstitution: 'http://localhost:3000/v1/\\1' },
        },
      },
      warnings: [],
    });
  });

  it('rejects redirect protocols outside HTTP and HTTPS', () => {
    const base = sampleRules[0];
    expect(base).toBeDefined();
    if (!base) return;

    const result = compileDnrRule({ ...base, action: { kind: 'redirect', target: 'javascript:alert(1)' } });
    expect(result.ok).toBe(false);
  });

  it('uses a fixed redirect URL when the target has no capture references', () => {
    const base = sampleRules[0];
    expect(base).toBeDefined();
    if (!base) return;

    const result = compileDnrRule({
      ...base,
      condition: { ...base.condition, url: { kind: 'url-filter', value: '||example.com^' } },
      action: { kind: 'redirect', target: 'https://example.net/' },
    });
    expect(result).toMatchObject({
      ok: true,
      rule: { action: { type: 'redirect', redirect: { url: 'https://example.net/' } } },
    });
  });

  it('rejects capture references that Chrome DNR cannot substitute', () => {
    const base = sampleRules[0];
    expect(base).toBeDefined();
    if (!base) return;

    const result = compileDnrRule({
      ...base,
      action: { kind: 'redirect', target: 'https://example.com/$10' },
    });
    expect(result.ok).toBe(false);
  });

  it('rejects capture references on a URL-filter rule', () => {
    const base = sampleRules[0];
    expect(base).toBeDefined();
    if (!base) return;

    const result = compileDnrRule({
      ...base,
      condition: { ...base.condition, url: { kind: 'url-filter', value: '||example.com^' } },
      action: { kind: 'redirect', target: 'https://example.net/$1' },
    });
    expect(result.ok).toBe(false);
  });

  it('rejects forbidden request headers', () => {
    const base = sampleRules[2];
    expect(base).toBeDefined();
    if (!base) return;

    const result = compileDnrRule({
      ...base,
      action: { kind: 'modify-request-headers', operations: [{ header: 'Cookie', operation: 'remove' }] },
    });
    expect(result.ok).toBe(false);
  });
});
