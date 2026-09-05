import { describe, expect, it } from 'vitest';

import { analyzeRuleState, createRuleRuntimePlan, getRuleQuotaUsage } from '@/domain/rules/diagnostics';
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
      condition: {
        url: { kind: 'wildcard', value: 'https://one.example/*' },
        resourceTypes: ['main_frame'],
      },
      action: { kind: 'redirect', target: 'https://two.example/page' },
    };
    const second: Rule = {
      ...base,
      id: 'second',
      dnrId: 3002,
      condition: {
        url: { kind: 'wildcard', value: 'https://two.example/*' },
        resourceTypes: ['main_frame'],
      },
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
    const redirect = sampleRules[0];
    expect(active).toBeDefined();
    expect(review).toBeDefined();
    expect(redirect).toBeDefined();
    if (!active || !review || !redirect) return;

    const { initiatorDomains: ignored, ...invalidCondition } = redirect.condition;
    void ignored;
    const invalid = { ...redirect, condition: invalidCondition };

    expect(getRuleQuotaUsage(stateWith([active, review, invalid]))).toMatchObject({ used: 1, limit: 4_500 });
  });

  it('tracks and deterministically limits regex-backed rules below the browser quota', () => {
    const base = sampleRules[0];
    const safe = sampleRules[1];
    expect(base).toBeDefined();
    expect(safe).toBeDefined();
    if (!base || !safe) return;
    const firstRegex = { ...base, id: 'first-regex', dnrId: 4201 };
    const overflowRegex = {
      ...base,
      id: 'overflow-regex',
      dnrId: 4202,
      condition: {
        ...base.condition,
        url: { kind: 'regex' as const, value: '^https://overflow\\.example/(.*)$' },
      },
    };
    const urlFilter = {
      ...safe,
      id: 'url-filter',
      dnrId: 4203,
      condition: { ...safe.condition, url: { kind: 'url-filter' as const, value: '||safe.example^' } },
    };
    const state = stateWith([firstRegex, overflowRegex, urlFilter]);

    expect(getRuleQuotaUsage(state)).toMatchObject({
      regexUsed: 2,
      regexLimit: 900,
      regexRemaining: 898,
    });
    const plan = createRuleRuntimePlan(state, 4_500, 1);
    expect(plan.installableRuleIds).toEqual(new Set([firstRegex.id, urlFilter.id]));
    expect(plan.quotaBlockedRuleIds).toEqual(new Set([overflowRegex.id]));
  });

  it('excludes every conflicting rule before allocating deterministic quota slots', () => {
    const base = sampleRules[1];
    expect(base).toBeDefined();
    if (!base) return;
    const conflict = { ...base, id: 'conflict', dnrId: 4100 };
    const firstSafe = {
      ...base,
      id: 'first-safe',
      dnrId: 4101,
      condition: { ...base.condition, url: { kind: 'url-filter' as const, value: '||first.example^' } },
    };
    const overflow = {
      ...base,
      id: 'overflow',
      dnrId: 4102,
      condition: { ...base.condition, url: { kind: 'url-filter' as const, value: '||overflow.example^' } },
    };

    const plan = createRuleRuntimePlan(stateWith([base, conflict, firstSafe, overflow]), 1);

    expect(plan.conflictedRuleIds).toEqual(new Set([base.id, conflict.id]));
    expect(plan.installableRuleIds).toEqual(new Set([firstSafe.id]));
    expect(plan.quotaBlockedRuleIds).toEqual(new Set([overflow.id]));
  });

  it('bounds related conflict evidence for oversized imported groups', () => {
    const base = sampleRules[1];
    expect(base).toBeDefined();
    if (!base) return;
    const conflicts = Array.from({ length: 30 }, (_, index): Rule => ({
      ...base,
      id: `bulk-conflict-${index}`,
      dnrId: 5_000 + index,
    }));

    const diagnostics = analyzeRuleState(stateWith(conflicts));

    expect(Object.keys(diagnostics)).toHaveLength(30);
    expect(
      Object.values(diagnostics).every((items) => items.every((item) => item.relatedRuleIds.length <= 20)),
    ).toBe(true);
  });
});

it('finds cycles without flagging a chain that only leads into them', () => {
  const base = sampleRules[0]!;
  const rules = ['a', 'b', 'c', 'd'].map((id, index): Rule => ({
    ...base,
    id,
    dnrId: 8000 + index,
    condition: {
      url: { kind: 'url-filter', value: `|https://${id}.example/|` },
      resourceTypes: ['main_frame'],
    },
    action: { kind: 'redirect', target: `https://${['b', 'c', 'b', 'd'][index]}.example/` },
  }));
  const diagnostics = analyzeRuleState(stateWith(rules));
  expect(Object.keys(diagnostics).sort()).toEqual(['b', 'c', 'd']);
});

it('handles a complete quota-sized redirect chain without recursion or false cycles', () => {
  const base = sampleRules[0]!;
  const rules = Array.from({ length: 4_500 }, (_, i): Rule => ({
    ...base,
    id: `chain-${i}`,
    dnrId: 10000 + i,
    condition: {
      url: { kind: 'url-filter', value: `|https://chain.example/${i}|` },
      resourceTypes: ['main_frame'],
    },
    action: { kind: 'redirect', target: `https://chain.example/${i + 1}` },
  }));
  expect(analyzeRuleState(stateWith(rules))).toEqual({});
  rules[4499] = { ...rules[4499]!, action: { kind: 'redirect', target: 'https://chain.example/0' } };
  expect(Object.keys(analyzeRuleState(stateWith(rules)))).toHaveLength(4500);
});
