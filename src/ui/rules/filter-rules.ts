import type { ResourceType, Rule } from '@/domain/rules/model';
import type { Translate } from '@/ui/i18n';

export const RULE_ACTION_FILTERS = [
  'block',
  'redirect',
  'upgrade-scheme',
  'modify-request-headers',
] as const satisfies readonly Rule['action']['kind'][];

export type RuleActionFilter = 'all' | (typeof RULE_ACTION_FILTERS)[number];
export type RuleResourceTypeFilter = 'all' | ResourceType;

export type RuleListCriteria = {
  query: string;
  action: RuleActionFilter;
  resourceType: RuleResourceTypeFilter;
};

export function localizedActionKindLabel(kind: Rule['action']['kind'], t: Translate): string {
  return t(
    kind === 'block'
      ? 'actionBlockShort'
      : kind === 'redirect'
        ? 'actionRedirectShort'
        : kind === 'upgrade-scheme'
          ? 'actionUpgradeShort'
          : 'actionHeaderShort',
  );
}

export function localizedActionLabel(action: Rule['action'], t: Translate): string {
  return localizedActionKindLabel(action.kind, t);
}

export function localizedResourceTypeLabel(type: ResourceType, t: Translate): string {
  const keys = {
    main_frame: 'resourceMainFrame',
    sub_frame: 'resourceSubFrame',
    stylesheet: 'resourceStylesheet',
    script: 'resourceScript',
    image: 'resourceImage',
    font: 'resourceFont',
    object: 'resourceObject',
    xmlhttprequest: 'resourceXmlHttpRequest',
    ping: 'resourcePing',
    media: 'resourceMedia',
    websocket: 'resourceWebSocket',
    other: 'resourceOther',
  } as const;
  return t(keys[type]);
}

export function ruleMatchesQuery(rule: Rule, query: string, t: Translate): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return true;
  return [rule.name, localizedActionLabel(rule.action, t), rule.condition.url.value].some((value) =>
    value.toLocaleLowerCase().includes(normalizedQuery),
  );
}

export function ruleMatchesFilters(
  rule: Rule,
  action: RuleActionFilter,
  resourceType: RuleResourceTypeFilter,
): boolean {
  if (action !== 'all' && rule.action.kind !== action) return false;
  if (resourceType === 'all') return true;

  const resourceTypes = rule.condition.resourceTypes;
  return !resourceTypes || resourceTypes.length === 0 || resourceTypes.includes(resourceType);
}

export function ruleMatchesRuleList(rule: Rule, criteria: RuleListCriteria, t: Translate): boolean {
  return (
    ruleMatchesQuery(rule, criteria.query, t) &&
    ruleMatchesFilters(rule, criteria.action, criteria.resourceType)
  );
}
