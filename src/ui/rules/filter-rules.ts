import type { Rule } from '@/domain/rules/model';
import type { Translate } from '@/ui/i18n';

export function localizedActionLabel(action: Rule['action'], t: Translate): string {
  return t(
    action.kind === 'block'
      ? 'actionBlockShort'
      : action.kind === 'redirect'
        ? 'actionRedirectShort'
        : action.kind === 'upgrade-scheme'
          ? 'actionUpgradeShort'
          : 'actionHeaderShort',
  );
}

export function ruleMatchesQuery(rule: Rule, query: string, t: Translate): boolean {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return true;
  return [rule.name, localizedActionLabel(rule.action, t), rule.condition.url.value].some((value) =>
    value.toLocaleLowerCase().includes(normalizedQuery),
  );
}
