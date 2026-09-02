import { describe, expect, it } from 'vitest';

import { createRule } from '@/application/rule-service';
import type { Rule } from '@/domain/rules/model';
import { validateRule, type ValidationIssue } from '@/domain/rules/validate';

type ValidationCode = ValidationIssue['code'];

function errorCodes(rule: Rule): ValidationCode[] {
  return validateRule(rule).errors.map((issue) => issue.code);
}

describe('rule validation boundaries', () => {
  it('reports the schema boundary for an empty name', () => {
    expect(errorCodes({ ...createRule(), name: '' })).toContain('schema-invalid');
  });

  it('reports invalid regular expressions', () => {
    const rule = createRule();
    expect(errorCodes({ ...rule, condition: { url: { kind: 'regex', value: '[' } } })).toContain(
      'regex-invalid',
    );
  });

  it('warns when a wildcard behaves like an exact match', () => {
    const rule = createRule();
    expect(
      validateRule({ ...rule, condition: { url: { kind: 'wildcard', value: 'https://example.com/' } } })
        .warnings,
    ).toContainEqual(expect.objectContaining({ code: 'wildcard-without-star' }));
  });

  it.each([
    ['redirect-scheme', 'ftp://example.com/file'],
    ['redirect-url-invalid', 'not a URL'],
  ] as const)('reports %s for an unsafe destination', (code, target) => {
    const rule = createRule();
    expect(errorCodes({ ...rule, action: { kind: 'redirect', target } })).toContain(code);
  });

  it('rejects self redirects', () => {
    const rule = createRule();
    expect(errorCodes({ ...rule, action: { kind: 'redirect', target: rule.condition.url.value } })).toContain(
      'redirect-self',
    );
  });

  it('requires a capture-capable matcher for redirect captures', () => {
    const rule = createRule();
    expect(
      errorCodes({
        ...rule,
        condition: { url: { kind: 'url-filter', value: '||example.com^' } },
        action: { kind: 'redirect', target: 'https://target.example/$1' },
      }),
    ).toContain('capture-match-required');
  });

  it('limits redirect captures to $1 through $9', () => {
    const rule = createRule();
    expect(
      errorCodes({ ...rule, action: { kind: 'redirect', target: 'https://target.example/$0' } }),
    ).toContain('capture-index-invalid');
  });

  it('rejects malformed initiator domains', () => {
    const rule = createRule();
    expect(
      errorCodes({ ...rule, condition: { ...rule.condition, initiatorDomains: ['https://example.com'] } }),
    ).toContain('initiator-domain-invalid');
  });

  it('requires an initiator for subresource-changing actions', () => {
    const rule = createRule();
    expect(
      errorCodes({
        ...rule,
        condition: { ...rule.condition, resourceTypes: ['xmlhttprequest'] },
        action: { kind: 'redirect', target: 'https://target.example/' },
      }),
    ).toContain('initiator-permission-required');
  });

  it.each([
    ['header-name-invalid', 'bad header'],
    ['header-forbidden', 'Cookie'],
  ] as const)('reports %s for the header boundary', (code, header) => {
    const rule = createRule();
    expect(
      errorCodes({
        ...rule,
        action: { kind: 'modify-request-headers', operations: [{ header, operation: 'remove' }] },
      }),
    ).toContain(code);
  });
});
