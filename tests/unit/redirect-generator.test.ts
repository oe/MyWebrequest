import { describe, expect, it } from 'vitest';
import { createRule } from '@/application/rule-service';
import { generateRedirectRule } from '@/application/redirect-generator';
import { matchRule } from '@/domain/rules/test-match';
import { compileDnrRule } from '@/domain/rules/compile-dnr';
import { requiredPermissionOrigins } from '@/domain/rules/permissions';

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
