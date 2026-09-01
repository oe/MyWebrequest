import { describe, expect, it } from 'vitest';

import { sampleRules } from '@/domain/rules/fixtures';
import { ruleMatchesOrigin } from '@/domain/rules/origin-scope';

describe('rule origin scope', () => {
  it('matches exact and wildcard-subdomain permission patterns', () => {
    const rule = sampleRules[1];
    expect(rule).toBeDefined();
    if (!rule) return;

    const wildcardRule = { ...rule, permissionOrigins: ['*://*.analytics.example.com/*'] };
    expect(ruleMatchesOrigin(wildcardRule, 'https://analytics.example.com')).toBe(true);
    expect(ruleMatchesOrigin(wildcardRule, 'http://sub.analytics.example.com')).toBe(true);
    expect(ruleMatchesOrigin(wildcardRule, 'https://example.com')).toBe(false);
  });

  it('respects an explicit scheme and rejects unavailable page labels', () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;

    expect(ruleMatchesOrigin(rule, 'https://api.example.com')).toBe(true);
    expect(ruleMatchesOrigin(rule, 'http://api.example.com')).toBe(false);
    expect(ruleMatchesOrigin(rule, 'Unavailable on this page')).toBe(false);
  });

  it('matches legacy permission origins that include an explicit port', () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;

    const portRule = { ...rule, permissionOrigins: ['http://localhost:4174/*'] };
    expect(ruleMatchesOrigin(portRule, 'http://localhost:4174')).toBe(true);
    expect(ruleMatchesOrigin(portRule, 'http://localhost:9000')).toBe(true);
    expect(ruleMatchesOrigin(portRule, 'https://localhost:4174')).toBe(false);
  });

  it('matches a global host pattern without weakening explicit schemes', () => {
    const rule = sampleRules[0];
    expect(rule).toBeDefined();
    if (!rule) return;

    expect(ruleMatchesOrigin({ ...rule, permissionOrigins: ['*://*/*'] }, 'https://example.net')).toBe(true);
    expect(ruleMatchesOrigin({ ...rule, permissionOrigins: ['https://*/*'] }, 'http://example.net')).toBe(
      false,
    );
  });
});
