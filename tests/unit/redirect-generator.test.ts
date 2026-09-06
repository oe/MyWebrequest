import type { Rule } from '@/domain/rules/model';
import { ruleSchema } from '@/domain/rules/schema';
import { analyzeRuleState } from '@/domain/rules/diagnostics';
import { describe, expect, it } from 'vitest';
import { createRule } from '@/application/rule-service';
import { generateRedirectRule, redirectBuilderState } from '@/application/redirect-generator';
import { matchRule } from '@/domain/rules/test-match';
import { compileDnrRule } from '@/domain/rules/compile-dnr';
import { requiredPermissionOrigins, permissionOriginsFromMatch } from '@/domain/rules/permissions';

describe('automatic redirect generation', () => {
  it('creates a disabled page-only rule with literal, case-sensitive path and query matching', () => {
    const result = generateRedirectRule(
      createRule(),
      'https://EXAMPLE.com/a.b?x=1&next=*',
      'https://target.test/new',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rule.enabled).toBe(false);
    expect(result.rule.condition.resourceTypes).toEqual(['main_frame']);
    expect(requiredPermissionOrigins(result.rule)).toEqual(['https://example.com/*']);
    expect(matchRule(result.rule, 'https://example.com/a.b?x=1&next=*')).toMatchObject({
      matched: true,
      result: 'https://target.test/new',
    });
    for (const url of [
      'https://example.com/A.b?x=1&next=*',
      'https://example.com/axb?x=1&next=*',
      'https://example.com/a.b?x=1&next=anything',
      'https://example.com/a.b?x=1&next=*&extra=1',
    ]) {
      expect(matchRule(result.rule, url).matched).toBe(false);
    }
    expect(compileDnrRule(result.rule).ok).toBe(true);
  });
  it('normalizes international domains, default ports and empty paths', () => {
    const result = generateRedirectRule(createRule(), 'https://例子.测试:443', 'https://destination.test');
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(matchRule(result.rule, result.source)).toMatchObject({
        matched: true,
        result: 'https://destination.test/',
      });
  });
  it.each([
    ['javascript:alert(1)', 'https://b.test', 'url'],
    ['https://user:pass@a.test', 'https://b.test', 'url'],
    ['a.test', 'https://b.test', 'url'],
    ['https://a.test/#part', 'https://b.test', 'fragment'],
    ['https://a.test', 'https://a.test:443/', 'same'],
    ['https://a.test', 'https://a.test/#part', 'same'],
    ['https://a.test', 'https://b.test/$1', 'placeholder'],
    ['https://a.test/' + 'a'.repeat(2000), 'https://b.test', 'long'],
  ])('rejects unsupported or misleading mappings', (from, to, error) => {
    expect(generateRedirectRule(createRule(), from, to)).toEqual({ ok: false, error });
  });
});

describe('redirect scope and editable intent', () => {
  it('uses native, case-sensitive exact filters for ordinary URLs', () => {
    const generated = generateRedirectRule(createRule(), 'https://a.test/Path?q=X', 'https://b.test/new');
    if (!generated.ok) throw new Error('generation failed');
    expect(compileDnrRule(generated.rule)).toMatchObject({
      ok: true,
      rule: {
        condition: { urlFilter: '|https://a.test/Path?q=X|', isUrlFilterCaseSensitive: true },
        action: { redirect: { url: 'https://b.test/new' } },
      },
    });
    expect(matchRule(generated.rule, 'https://a.test/path?q=X').matched).toBe(false);
    expect(matchRule(generated.rule, 'https://a.test/Path?q=x').matched).toBe(false);
    expect(matchRule(generated.rule, 'https://a.test/Path?q=X&extra=1').matched).toBe(false);
  });

  it('replaces only the host and retains different paths, queries and ports without regex', () => {
    const generated = generateRedirectRule(
      createRule(),
      'https://a.test:8443/one?q=1',
      'https://b.test:8443/one?q=1',
      'host',
    );
    if (!generated.ok) throw new Error('generation failed');
    expect(compileDnrRule(generated.rule, 'chrome')).toMatchObject({
      ok: true,
      rule: {
        condition: { urlFilter: '|https://a.test:8443/', resourceTypes: ['main_frame'] },
        action: { redirect: { transform: { host: 'b.test' } } },
      },
    });
    expect(compileDnrRule(generated.rule, 'firefox')).toEqual(compileDnrRule(generated.rule, 'chrome'));
    expect(matchRule(generated.rule, 'https://a.test:8443/another?q=two&next=%2Fx')).toMatchObject({
      matched: true,
      result: 'https://b.test:8443/another?q=two&next=%2Fx',
    });
    for (const candidate of [
      'http://a.test:8443/one',
      'https://a.test/one',
      'https://sub.a.test:8443/one',
      'https://a.test.evil:8443/one',
      'https://b.test:8443/one',
    ]) {
      expect(matchRule(generated.rule, candidate).matched).toBe(false);
    }
    expect(requiredPermissionOrigins(generated.rule)).toEqual(['https://a.test/*']);
  });

  it.each([
    'http://b.test/one?q=1',
    'https://b.test:8443/one?q=1',
    'https://b.test/two?q=1',
    'https://b.test/one?q=2',
    'https://b.test/one?q=1#part',
  ])('does not infer host scope when other parts differ: %s', (target) => {
    expect(generateRedirectRule(createRule(), 'https://a.test/one?q=1', target, 'host')).toEqual({
      ok: false,
      error: 'hostUnavailable',
    });
  });

  it('round-trips editable scope through storage and rejects stale advanced edits', () => {
    const generated = generateRedirectRule(createRule(), 'https://a.test/one', 'https://b.test/one', 'host');
    if (!generated.ok) throw new Error('generation failed');
    const restored = ruleSchema.parse(JSON.parse(JSON.stringify(generated.rule))) as Rule;
    expect(redirectBuilderState(restored)).toEqual(generated.rule.redirectBuilder);
    expect(
      redirectBuilderState({ ...restored, condition: { ...restored.condition, requestMethods: ['get'] } }),
    ).toBeNull();
    expect(
      redirectBuilderState({
        ...restored,
        condition: { ...restored.condition, url: { kind: 'url-filter', value: '||a.test^' } },
      }),
    ).toBeNull();
    expect(
      redirectBuilderState({ ...restored, action: { kind: 'redirect', target: 'https://other.test' } }),
    ).toBeNull();
    expect(redirectBuilderState({ ...restored, name: 'My custom name', enabled: true })).toEqual(
      generated.rule.redirectBuilder,
    );
  });

  it('recognizes the previous exact regex generator without reinterpreting arbitrary regexes', () => {
    const rule = createRule();
    rule.condition = {
      url: { kind: 'regex', value: '(?-i)^https://a\\.test/one$' },
      resourceTypes: ['main_frame'],
    };
    rule.action = { kind: 'redirect', target: 'https://b.test/two' };
    rule.permissionOrigins = ['https://a.test/*'];
    expect(redirectBuilderState(rule)).toEqual({
      source: 'https://a.test/one',
      target: 'https://b.test/two',
      scope: 'exact',
    });
    rule.condition.url.value = '(?-i)^https://a\\.test/(.*)$';
    expect(redirectBuilderState(rule)).toBeNull();
  });

  it('detects a cycle between host replacement and an exact rule on a different path', () => {
    const first = generateRedirectRule(
      createRule(),
      'https://a.test/example',
      'https://b.test/example',
      'host',
    );
    const second = generateRedirectRule(createRule(), 'https://b.test/other', 'https://a.test/other');
    if (!first.ok || !second.ok) throw new Error('generation failed');
    const rules = [first.rule, second.rule].map((rule) => ({ ...rule, enabled: true }));
    const state = {
      schemaVersion: 1 as const,
      rules: Object.fromEntries(rules.map((rule) => [rule.id, rule])),
      order: rules.map((rule) => rule.id),
      settings: { globallyPaused: false },
    };
    expect(analyzeRuleState(state)[first.rule.id]).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'redirect-cycle' })]),
    );
  });
});

it('keeps bounded host permissions when an anchored generated pattern is edited', () => {
  expect(permissionOriginsFromMatch('|https://a.test:8443/Path?q=X|')).toEqual(['https://a.test/*']);
  expect(permissionOriginsFromMatch('|https://a.test/')).toEqual(['https://a.test/*']);
  expect(permissionOriginsFromMatch('(?-i)^https://a\\.test/Path$')).toEqual(['https://a.test/*']);
});

it('preserves raw queries and hash semantics for exactly one path, including storage round trips', () => {
  const generated = generateRedirectRule(
    createRule(),
    'https://a.test:8443/Page?example=1#example',
    'https://b.test:9443/New',
    'path',
  );
  if (!generated.ok) throw new Error('generation failed');
  const restored = ruleSchema.parse(JSON.parse(JSON.stringify(generated.rule))) as Rule;
  expect(redirectBuilderState(restored)).toEqual(generated.rule.redirectBuilder);
  for (const suffix of ['', '?', '?x=a%2Fb&x=2&space=a+b&empty=', '?q=%23hash#section', '#section']) {
    expect(matchRule(restored, 'https://a.test:8443/Page' + suffix)).toMatchObject({
      matched: true,
      result: 'https://b.test:9443/New' + suffix,
    });
  }
  for (const candidate of [
    'https://a.test:8443/page?x=1',
    'https://a.test:8443/Page/child?x=1',
    'https://a.test:8443/Page2',
    'https://a.test/Page',
    'https://sub.a.test:8443/Page',
    'http://a.test:8443/Page',
  ]) {
    expect(matchRule(restored, candidate).matched).toBe(false);
  }
  expect(compileDnrRule(restored)).toMatchObject({
    ok: true,
    rule: {
      action: { redirect: { transform: { scheme: 'https', host: 'b.test', port: '9443', path: '/New' } } },
    },
  });
  const fixedHash = generateRedirectRule(
    createRule(),
    'https://a.test/Page',
    'https://b.test/New#fixed',
    'path',
  );
  if (!fixedHash.ok) throw new Error('generation failed');
  expect(matchRule(fixedHash.rule, 'https://a.test/Page?x=1#old')).toMatchObject({
    matched: true,
    result: 'https://b.test/New?x=1#fixed',
  });
  expect(
    redirectBuilderState({ ...restored, action: { kind: 'redirect', target: generated.target } }),
  ).toBeNull();
});

it('rejects ambiguous destination queries and path-preserving self redirects', () => {
  for (const target of ['https://b.test/new?x=1', 'https://b.test/new?']) {
    expect(generateRedirectRule(createRule(), 'https://a.test/page', target, 'path')).toEqual({
      ok: false,
      error: 'targetQuery',
    });
  }
  expect(
    generateRedirectRule(createRule(), 'https://a.test/page?x=1', 'https://a.test/page#new', 'path'),
  ).toEqual({ ok: false, error: 'same' });
});
