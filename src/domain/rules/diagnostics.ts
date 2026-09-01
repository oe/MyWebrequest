import type { Rule, StoredState } from './model';
import { matchRule } from './test-match';
import { validateRule } from './validate';

export const INTERNAL_DYNAMIC_RULE_LIMIT = 4_500;
export const INTERNAL_REGEX_RULE_LIMIT = 900;
const MAX_RELATED_RULE_IDS = 20;

export type RuleDiagnostic =
  | { code: 'priority-conflict'; relatedRuleIds: string[] }
  | { code: 'redirect-cycle'; relatedRuleIds: string[] };

export type RuleQuotaUsage = {
  used: number;
  limit: number;
  remaining: number;
  regexUsed: number;
  regexLimit: number;
  regexRemaining: number;
};

export type RuleRuntimePlan = {
  installableRuleIds: ReadonlySet<string>;
  conflictedRuleIds: ReadonlySet<string>;
  quotaBlockedRuleIds: ReadonlySet<string>;
};

function runnableRules(state: StoredState): Rule[] {
  return state.order.flatMap((id) => {
    const rule = state.rules[id];
    return rule?.enabled && rule.migrationState === 'none' && validateRule(rule).valid ? [rule] : [];
  });
}

function usesRegexFilter(rule: Rule): boolean {
  return rule.condition.url.kind !== 'url-filter';
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

  const priorityGroups = new Map<string, Rule[]>();
  for (const rule of rules) {
    const key = `${rule.priority}:${normalizedCondition(rule)}`;
    const group = priorityGroups.get(key);
    if (group) group.push(rule);
    else priorityGroups.set(key, [rule]);
  }
  for (const group of priorityGroups.values()) {
    if (group.length < 2) continue;
    const representativeIds = group.slice(0, MAX_RELATED_RULE_IDS + 1).map((rule) => rule.id);
    for (const rule of group) {
      add(rule.id, {
        code: 'priority-conflict',
        relatedRuleIds: representativeIds
          .filter((candidateId) => candidateId !== rule.id)
          .slice(0, MAX_RELATED_RULE_IDS),
      });
    }
  }

  const edges = redirectEdges(rules.filter((rule) => !diagnostics[rule.id]?.length));
  for (const ruleId of edges.keys()) {
    if (reachesStart(ruleId, ruleId, edges, new Set([ruleId]))) {
      add(ruleId, { code: 'redirect-cycle', relatedRuleIds: edges.get(ruleId) ?? [] });
    }
  }

  return diagnostics;
}

export function getRuleQuotaUsage(state: StoredState): RuleQuotaUsage {
  const rules = runnableRules(state);
  const used = rules.length;
  const regexUsed = rules.filter(usesRegexFilter).length;
  return {
    used,
    limit: INTERNAL_DYNAMIC_RULE_LIMIT,
    remaining: INTERNAL_DYNAMIC_RULE_LIMIT - used,
    regexUsed,
    regexLimit: INTERNAL_REGEX_RULE_LIMIT,
    regexRemaining: INTERNAL_REGEX_RULE_LIMIT - regexUsed,
  };
}

export function createRuleRuntimePlan(
  state: StoredState,
  limit = INTERNAL_DYNAMIC_RULE_LIMIT,
  regexLimit = INTERNAL_REGEX_RULE_LIMIT,
): RuleRuntimePlan {
  const diagnostics = analyzeRuleState(state);
  const conflictedRuleIds = new Set(
    Object.entries(diagnostics).flatMap(([id, items]) => (items.length > 0 ? [id] : [])),
  );
  const candidates = runnableRules(state).filter((rule) => !conflictedRuleIds.has(rule.id));
  const installableRuleIds = new Set<string>();
  const quotaBlockedRuleIds = new Set<string>();
  let regexCount = 0;

  for (const rule of candidates) {
    const regexBlocked = usesRegexFilter(rule) && regexCount >= regexLimit;
    if (installableRuleIds.size >= limit || regexBlocked) {
      quotaBlockedRuleIds.add(rule.id);
      continue;
    }
    installableRuleIds.add(rule.id);
    if (usesRegexFilter(rule)) regexCount += 1;
  }

  return { installableRuleIds, conflictedRuleIds, quotaBlockedRuleIds };
}
