import type { Rule, StoredState } from '@/domain/rules/model';
import { stableDnrId } from '@/domain/rules/model';
import { permissionOriginsFromMatch } from '@/domain/rules/permissions';

export { permissionOriginsFromMatch } from '@/domain/rules/permissions';

export function createRule(origin?: string, name = 'Untitled rule'): Rule {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const match = origin ? `${origin.replace(/\/$/, '')}/*` : 'https://example.com/*';
  return {
    schemaVersion: 1,
    id,
    dnrId: stableDnrId(id),
    name,
    enabled: false,
    priority: 1,
    condition: { url: { kind: 'wildcard', value: match } },
    action: { kind: 'block' },
    permissionOrigins: permissionOriginsFromMatch(match),
    migrationState: 'none',
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertRule(state: StoredState, rule: Rule): StoredState {
  const exists = Boolean(state.rules[rule.id]);
  return {
    ...state,
    rules: {
      ...state.rules,
      [rule.id]: { ...rule, updatedAt: new Date().toISOString() },
    },
    order: exists ? state.order : [rule.id, ...state.order],
  };
}

export function removeRule(state: StoredState, id: string): StoredState {
  const { [id]: removed, ...rules } = state.rules;
  void removed;
  return { ...state, rules, order: state.order.filter((ruleId) => ruleId !== id) };
}

export function duplicateRule(
  state: StoredState,
  source: Rule,
  name: string,
): { state: StoredState; rule: Rule } {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const rule: Rule = {
    ...source,
    id,
    dnrId: stableDnrId(id),
    name,
    enabled: false,
    migrationState: source.migrationState === 'none' ? 'none' : 'review-required',
    createdAt: now,
    updatedAt: now,
  };
  return { state: upsertRule(state, rule), rule };
}

export function restoreRule(state: StoredState, rule: Rule, index: number): StoredState {
  if (state.rules[rule.id]) return state;
  const order = [...state.order];
  order.splice(Math.max(0, Math.min(index, order.length)), 0, rule.id);
  return { ...state, rules: { ...state.rules, [rule.id]: rule }, order };
}

export function updatePausedState(state: StoredState, globallyPaused: boolean): StoredState {
  return { ...state, settings: { ...state.settings, globallyPaused } };
}
