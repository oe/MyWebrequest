import type { Rule, StoredState } from './model';
import { matchRule } from './test-match';

export const INTERNAL_DYNAMIC_RULE_LIMIT = 4_500;

export type RuleDiagnostic =
  | { code: 'priority-conflict'; relatedRuleIds: string[] }
  | { code: 'redirect-cycle'; relatedRuleIds: string[] };

export type RuleQuotaUsage = {
  used: number;
  limit: number;
  remaining: number;
};

function runnableRules(state: StoredState): Rule[] {
  return state.order.flatMap((id) => {
    const rule = state.rules[id];
    return rule?.enabled && rule.migrationState === 'none' ? [rule] : [];
  });
}

function normalizedCondition(rule: Rule): string {
  return JSON.stringify({
    url: rule.condition.url,
    resourceTypes: [...(rule.condition.resourceTypes ?? [])].sort(),
    requestMethods: [...(rule.condition.requestMethods ?? [])].sort(),
    initiatorDomains: [...(rule.condition.initiatorDomains ?? [])].sort(),
  });
}

function redirectEdges(rules: Rule[]): Map<string, string[]> {
  const redirects = rules.filter(
    (rule): rule is Rule & { action: Extract<Rule['action'], { kind: 'redirect' }> } =>
      rule.action.kind === 'redirect' && !/\$\d+/.test(rule.action.target),
  );
  return new Map(
    redirects.map((rule) => [
      rule.id,
      redirects
        .filter((candidate) => matchRule(candidate, rule.action.target).matched)
        .map((candidate) => candidate.id),
    ]),
  );
}

function reachesStart(
  startId: string,
  currentId: string,
  edges: ReadonlyMap<string, string[]>,
  visited: Set<string>,
): boolean {
  for (const nextId of edges.get(currentId) ?? []) {
    if (nextId === startId) return true;
    if (visited.has(nextId)) continue;
    visited.add(nextId);
    if (reachesStart(startId, nextId, edges, visited)) return true;
  }
  return false;
}

export function analyzeRuleState(state: StoredState): Record<string, RuleDiagnostic[]> {
  const rules = runnableRules(state);
  const diagnostics: Record<string, RuleDiagnostic[]> = {};
  const add = (id: string, diagnostic: RuleDiagnostic) => {
    diagnostics[id] = [...(diagnostics[id] ?? []), diagnostic];
  };

  for (let leftIndex = 0; leftIndex < rules.length; leftIndex += 1) {
    const left = rules[leftIndex];
    if (!left) continue;
    for (let rightIndex = leftIndex + 1; rightIndex < rules.length; rightIndex += 1) {
      const right = rules[rightIndex];
      if (!right) continue;
      if (left.priority !== right.priority || normalizedCondition(left) !== normalizedCondition(right)) {
        continue;
      }
      add(left.id, { code: 'priority-conflict', relatedRuleIds: [right.id] });
      add(right.id, { code: 'priority-conflict', relatedRuleIds: [left.id] });
    }
  }

  const edges = redirectEdges(rules);
  for (const ruleId of edges.keys()) {
    if (reachesStart(ruleId, ruleId, edges, new Set([ruleId]))) {
      add(ruleId, { code: 'redirect-cycle', relatedRuleIds: edges.get(ruleId) ?? [] });
    }
  }

  return diagnostics;
}

export function getRuleQuotaUsage(state: StoredState): RuleQuotaUsage {
  const used = runnableRules(state).length;
  return { used, limit: INTERNAL_DYNAMIC_RULE_LIMIT, remaining: INTERNAL_DYNAMIC_RULE_LIMIT - used };
}
