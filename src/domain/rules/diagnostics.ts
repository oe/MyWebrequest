import { PrefixIndex } from './prefix-index';
import type { Rule, StoredState } from './model';
import { compileUrlMatcher } from './test-match';
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

const runnableCache = new WeakMap<StoredState, Rule[]>();
const diagnosticsCache = new WeakMap<StoredState, Record<string, RuleDiagnostic[]>>();

function runnableRules(state: StoredState): Rule[] {
  const cached = runnableCache.get(state);
  if (cached) return cached;
  const rules = state.order.flatMap((id) => {
    const rule = state.rules[id];
    return rule?.enabled && rule.migrationState === 'none' && validateRule(rule).valid ? [rule] : [];
  });
  runnableCache.set(state, rules);
  return rules;
}

function usesRegexFilter(rule: Rule): boolean {
  return rule.condition.url.kind !== 'url-filter';
}

function normalizedCondition(rule: Rule): string {
  return JSON.stringify({
    url: rule.condition.url,
    isUrlFilterCaseSensitive: rule.condition.isUrlFilterCaseSensitive ?? false,
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
  const exact = new Map<string, string[]>();
  type Candidate = { id: string; test: (url: string) => boolean };
  const other: Candidate[] = [];
  const sensitive = new PrefixIndex<Candidate>();
  const insensitive = new PrefixIndex<Candidate>();
  for (const rule of redirects) {
    const { kind, value } = rule.condition.url;
    if (
      !rule.condition.isUrlFilterCaseSensitive &&
      kind === 'url-filter' &&
      /^\|https?:\/\/[^*^|]+\|$/.test(value)
    ) {
      const url = value.slice(1, -1).toLowerCase();
      exact.set(url, [...(exact.get(url) ?? []), rule.id]);
    } else {
      try {
        const matcher = compileUrlMatcher(rule.condition.url, rule.condition.isUrlFilterCaseSensitive);
        const candidate = { id: rule.id, test: (url: string) => matcher.test(url) };
        other.push(candidate);
        const prefix = kind === 'wildcard' ? value.split('*')[0]! : '';
        // Non-ASCII case folding is left to RE2 to avoid false negatives.
        const safePrefix = /^[\x20-\x7e]*$/.test(prefix) ? prefix : '';
        if (rule.condition.isUrlFilterCaseSensitive) sensitive.add(safePrefix, candidate);
        else insensitive.add(safePrefix.toLowerCase(), candidate);
      } catch {
        // The browser support check rejects unsupported regex syntax before activation.
      }
    }
  }
  const destinations = new Map<string, string[]>();
  const edges = new Map<string, string[]>();
  for (const rule of redirects) {
    const targetUrl = new URL(rule.action.target);
    if (rule.action.transform) targetUrl.hostname = rule.action.transform.host;
    const target = targetUrl.href;
    let matches = destinations.get(target);
    if (!matches) {
      matches = [
        ...(exact.get(target.toLowerCase()) ?? []),
        ...(/^[\x20-\x7e]*$/.test(target)
          ? [...sensitive.candidates(target), ...insensitive.candidates(target.toLowerCase())]
          : other
        )
          .filter((candidate) => candidate.test(target))
          .map((candidate) => candidate.id),
      ];
      destinations.set(target, matches);
    }
    edges.set(rule.id, matches);
  }
  // Also connect host transforms to exact destinations at paths other than
  // the saved example. Pairwise scope checks keep this bounded to O(n²).
  const witnesses = redirects.flatMap((rule) => {
    const { kind, value } = rule.condition.url;
    if (kind !== 'url-filter' || !/^\|https?:\/\/[^*^|]+\|?$/.test(value)) return [];
    const url = new URL(value.replace(/^\|/, '').replace(/\|$/, ''));
    return [{ id: rule.id, url }];
  });
  const witnessesByHost = new Map<string, typeof witnesses>();
  for (const witness of witnesses) {
    const group = witnessesByHost.get(witness.url.hostname) ?? [];
    group.push(witness);
    witnessesByHost.set(witness.url.hostname, group);
  }
  for (const rule of redirects) {
    if (!rule.action.transform) continue;
    const origin = /^\|(https?:\/\/[^/*^|]+)\//.exec(rule.condition.url.value)?.[1];
    if (rule.condition.url.kind !== 'url-filter' || !origin) continue;
    const sourceHost = new URL(origin).hostname;
    const matcher = compileUrlMatcher(rule.condition.url, rule.condition.isUrlFilterCaseSensitive);
    const related = new Set(edges.get(rule.id));
    for (const witness of witnessesByHost.get(rule.action.transform.host) ?? []) {
      const source = new URL(witness.url.href);
      source.hostname = sourceHost;
      if (matcher.test(source.href)) related.add(witness.id);
    }
    edges.set(rule.id, [...related]);
  }
  return edges;
}

// Iterative strongly-connected components avoid a fresh graph traversal for
// every rule and do not overflow the JS stack on long redirect chains.
function cycleRuleIds(edges: ReadonlyMap<string, string[]>): Set<string> {
  const visited = new Set<string>();
  const order: string[] = [];
  const reverse = new Map<string, string[]>();
  for (const [id, nextIds] of edges) {
    for (const next of nextIds) {
      const incoming = reverse.get(next) ?? [];
      incoming.push(id);
      reverse.set(next, incoming);
    }
    if (visited.has(id)) continue;
    const stack: Array<{ id: string; index: number }> = [{ id, index: 0 }];
    visited.add(id);
    while (stack.length) {
      const frame = stack[stack.length - 1]!;
      const next = (edges.get(frame.id) ?? [])[frame.index++];
      if (next !== undefined) {
        if (!visited.has(next)) {
          visited.add(next);
          stack.push({ id: next, index: 0 });
        }
      } else {
        order.push(frame.id);
        stack.pop();
      }
    }
  }
  const assigned = new Set<string>();
  const cyclic = new Set<string>();
  for (const id of order.reverse()) {
    if (assigned.has(id)) continue;
    const component: string[] = [];
    const stack = [id];
    assigned.add(id);
    while (stack.length) {
      const current = stack.pop()!;
      component.push(current);
      for (const previous of reverse.get(current) ?? []) {
        if (!assigned.has(previous)) {
          assigned.add(previous);
          stack.push(previous);
        }
      }
    }
    if (component.length > 1 || edges.get(id)?.includes(id)) {
      for (const member of component) cyclic.add(member);
    }
  }
  return cyclic;
}

export function analyzeRuleState(state: StoredState): Record<string, RuleDiagnostic[]> {
  const cached = diagnosticsCache.get(state);
  if (cached) return cached;
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
  for (const ruleId of cycleRuleIds(edges)) {
    add(ruleId, {
      code: 'redirect-cycle',
      relatedRuleIds: (edges.get(ruleId) ?? []).slice(0, MAX_RELATED_RULE_IDS),
    });
  }
  diagnosticsCache.set(state, diagnostics);

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
