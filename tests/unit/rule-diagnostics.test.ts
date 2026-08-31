import { describe, expect, it } from 'vitest';

import { analyzeRuleState, getRuleQuotaUsage } from '@/domain/rules/diagnostics';
import { sampleRules } from '@/domain/rules/fixtures';
import type { Rule, StoredState } from '@/domain/rules/model';

function stateWith(rules: Rule[]): StoredState {
  return {
    schemaVersion: 1,
    rules: Object.fromEntries(rules.map((rule) => [rule.id, rule])),
    order: rules.map((rule) => rule.id),
    settings: { globallyPaused: false },
  };
}

describe('rule diagnostics', () => {
  it('detects equal-priority rules with the same normalized condition', () => {
    const base = sampleRules[1];
    expect(base).toBeDefined();
    if (!base) return;
    const copy = { ...base, id: 'conflicting-copy', dnrId: 2002 };

    expect(analyzeRuleState(stateWith([base, copy]))).toMatchObject({
      [base.id]: [{ code: 'priority-conflict', relatedRuleIds: [copy.id] }],
      [copy.id]: [{ code: 'priority-conflict', relatedRuleIds: [base.id] }],
    });
  });

  it('detects a redirect cycle across enabled rules', () => {
    const base = sampleRules[0];
    expect(base).toBeDefined();
    if (!base) return;
    const first: Rule = {
      ...base,
      id: 'first',
      dnrId: 3001,
      condition: { url: { kind: 'wildcard', value: 'https://one.example/*' } },
      action: { kind: 'redirect', target: 'https://two.example/page' },
    };
    const second: Rule = {
      ...base,
      id: 'second',
      dnrId: 3002,
      condition: { url: { kind: 'wildcard', value: 'https://two.example/*' } },
      action: { kind: 'redirect', target: 'https://one.example/page' },
    };

    expect(analyzeRuleState(stateWith([first, second]))).toMatchObject({
      first: expect.arrayContaining([{ code: 'redirect-cycle', relatedRuleIds: ['second'] }]),
      second: expect.arrayContaining([{ code: 'redirect-cycle', relatedRuleIds: ['first'] }]),
    });
  });

  it('counts only enabled runnable dynamic rules toward the internal quota', () => {
    const active = sampleRules[1];
    const review = sampleRules[3];
    expect(active).toBeDefined();
    expect(review).toBeDefined();
    if (!active || !review) return;

    expect(getRuleQuotaUsage(stateWith([active, review]))).toMatchObject({ used: 1, limit: 4_500 });
  });
});
