import { useMemo, useState, type KeyboardEvent } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from 'lucide-react';

import type { RuleQuotaUsage } from '@/domain/rules/diagnostics';
import { RESOURCE_TYPES, type Rule, type RuleStatus } from '@/domain/rules/model';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/ui/components/input-group';
import { ScrollArea } from '@/ui/components/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import { Separator } from '@/ui/components/separator';
import { Switch } from '@/ui/components/switch';
import { useI18n } from '@/ui/i18n';
import { cn } from '@/ui/lib/utils';
import {
  localizedActionKindLabel,
  localizedActionLabel,
  localizedResourceTypeLabel,
  RULE_ACTION_FILTERS,
  ruleMatchesRuleList,
  type RuleActionFilter,
  type RuleResourceTypeFilter,
} from './filter-rules';
import { StatusBadge } from './status-badge';

type RuleListProps = {
  query: string;
  actionFilter: RuleActionFilter;
  resourceTypeFilter: RuleResourceTypeFilter;
  rules: Rule[];
  selectedId: string | null;
  statuses: Record<string, RuleStatus>;
  quota: RuleQuotaUsage | null;
  onQueryChange: (query: string) => void;
  onActionFilterChange: (action: RuleActionFilter) => void;
  onResourceTypeFilterChange: (resourceType: RuleResourceTypeFilter) => void;
  onSelect: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  pendingIds?: ReadonlySet<string>;
};

export function RuleList({
  query,
  actionFilter,
  resourceTypeFilter,
  rules,
  selectedId,
  statuses,
  quota,
  onQueryChange,
  onActionFilterChange,
  onResourceTypeFilterChange,
  onSelect,
  onToggle,
  pendingIds,
}: RuleListProps) {
  const { t } = useI18n();
  const sections: Array<{ label: string; statuses: RuleStatus[] }> = [
    {
      label: t('enabledSection'),
      statuses: [
        'active',
        'paused',
        'needs-permission',
        'not-applied',
        'runtime-error',
        'conflicted',
        'quota-blocked',
        'disabled',
        'invalid',
      ],
    },
    { label: t('needsReviewSection'), statuses: ['review-required', 'unsupported'] },
    { label: t('removedSection'), statuses: ['removed'] },
  ];
  const filtered = useMemo(
    () =>
      rules.filter((rule) =>
        ruleMatchesRuleList(rule, { query, action: actionFilter, resourceType: resourceTypeFilter }, t),
      ),
    [actionFilter, query, resourceTypeFilter, rules, t],
  );

  const ordered = sections.flatMap((section) =>
    filtered.filter((rule) => section.statuses.includes(statuses[rule.id] ?? 'disabled')),
  );
  const pageSize = 100;
  const filterKey = JSON.stringify([query, actionFilter, resourceTypeFilter]);
  const [navigation, setNavigation] = useState({ page: 0, filterKey, selectedId });
  const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
  let page = Math.min(navigation.page, pageCount - 1);
  if (filterKey !== navigation.filterKey) page = 0;
  else if (selectedId !== navigation.selectedId) {
    const index = ordered.findIndex((rule) => rule.id === selectedId);
    if (index >= 0) page = Math.floor(index / pageSize);
  }
  if (
    page !== navigation.page ||
    filterKey !== navigation.filterKey ||
    selectedId !== navigation.selectedId
  ) {
    setNavigation({ page, filterKey, selectedId });
  }
  const visibleIds = new Set(ordered.slice(page * pageSize, (page + 1) * pageSize).map((rule) => rule.id));
  const navigate = (nextPage: number) => setNavigation({ page: nextPage, filterKey, selectedId });

  const handleRuleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || !ordered.length) return;
    const region = event.currentTarget.closest('section');
    const currentIndex = ordered.findIndex((rule) => rule.id === event.currentTarget.dataset.ruleSelect);
    if (currentIndex < 0) return;
    event.preventDefault();
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? ordered.length - 1
          : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + ordered.length) % ordered.length;
    const next = ordered[nextIndex]!;
    setNavigation({ page: Math.floor(nextIndex / pageSize), filterKey, selectedId: next.id });
    onSelect(next.id);
    requestAnimationFrame(() => {
      const button = region?.querySelector<HTMLButtonElement>(
        `button[data-rule-select="${CSS.escape(next.id)}"]`,
      );
      button?.focus();
    });
  };

  return (
    <section
      aria-label={t('rules')}
      data-rule-list
      data-material="glass-content"
      className="flex h-full min-h-0 flex-col border-r max-[799px]:border-r-0"
    >
      <div className="shrink-0 border-b">
        <div className="p-3 min-[800px]:hidden">
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t('searchRules')}
              placeholder={t('searchRules')}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
          </InputGroup>
        </div>
        <div
          role="group"
          aria-label={t('filterRules')}
          className="grid grid-cols-2 gap-2 px-3 pb-3 min-[800px]:pt-3"
        >
          <Select
            value={actionFilter}
            onValueChange={(value) => onActionFilterChange(value as RuleActionFilter)}
          >
            <SelectTrigger className="w-full min-w-0" size="sm" aria-label={t('filterByAction')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{t('allActions')}</SelectItem>
                {RULE_ACTION_FILTERS.map((action) => (
                  <SelectItem key={action} value={action}>
                    {localizedActionKindLabel(action, t)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={resourceTypeFilter}
            onValueChange={(value) => onResourceTypeFilterChange(value as RuleResourceTypeFilter)}
          >
            <SelectTrigger className="w-full min-w-0" size="sm" aria-label={t('filterByResourceType')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{t('allResourceTypes')}</SelectItem>
                {RESOURCE_TYPES.map((resourceType) => (
                  <SelectItem key={resourceType} value={resourceType}>
                    {localizedResourceTypeLabel(resourceType, t)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ScrollArea key={`${filterKey}:${page}`} data-rule-list-scroll className="min-h-0 flex-1">
        {sections.map((section) => {
          const sectionRules = filtered.filter((rule) =>
            section.statuses.includes(statuses[rule.id] ?? 'disabled'),
          );
          if (!sectionRules.some((rule) => visibleIds.has(rule.id))) return null;
          return (
            <div key={section.label}>
              <div className="flex h-11 items-center gap-2 bg-muted/35 px-5 text-sm font-medium">
                <span>{section.label}</span>
                <Badge variant="secondary">{sectionRules.length}</Badge>
              </div>
              <Separator />
              <div role="list">
                {sectionRules
                  .filter((rule) => visibleIds.has(rule.id))
                  .map((rule) => {
                    const selected = selectedId === rule.id;
                    const status = statuses[rule.id] ?? 'disabled';
                    const editable =
                      rule.migrationState !== 'removed' && rule.migrationState !== 'unsupported';
                    return (
                      <div
                        key={rule.id}
                        role="listitem"
                        className={cn(
                          'grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center border-b transition-colors',
                          selected && 'bg-accent',
                        )}
                      >
                        <button
                          type="button"
                          data-rule-select={rule.id}
                          aria-current={selected ? 'true' : undefined}
                          className="flex min-w-0 items-center gap-3 self-stretch px-5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                          onClick={() => onSelect(rule.id)}
                          onKeyDown={handleRuleKeyDown}
                        >
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="truncate text-sm font-medium">{rule.name}</span>
                            <span className="truncate font-mono text-xs text-muted-foreground">
                              {rule.condition.url.value}
                            </span>
                            <span className="flex min-w-0 items-center gap-1.5">
                              <StatusBadge status={status} />
                              <Badge variant="outline">{localizedActionLabel(rule.action, t)}</Badge>
                            </span>
                          </div>
                          <ChevronRightIcon
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </button>
                        <div className="pr-4">
                          <Switch
                            aria-label={t(rule.enabled ? 'disableRule' : 'enableRule', { name: rule.name })}
                            checked={rule.enabled}
                            disabled={!editable || pendingIds?.has(rule.id)}
                            onCheckedChange={(checked) => onToggle(rule.id, checked)}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm font-medium">{t('noMatchingRules')}</p>
            <p className="text-sm text-muted-foreground">{t('noMatchingRulesDescription')}</p>
          </div>
        ) : null}
      </ScrollArea>
      {pageCount > 1 ? (
        <nav
          aria-label={t('rulePages')}
          className="flex shrink-0 items-center justify-between gap-2 border-t px-3 py-2"
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('previousPage')}
            disabled={page === 0}
            onClick={() => navigate(page - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          <span aria-live="polite" className="text-xs text-muted-foreground tabular-nums">
            {page + 1} / {pageCount}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('nextPage')}
            disabled={page + 1 === pageCount}
            onClick={() => navigate(page + 1)}
          >
            <ChevronRightIcon />
          </Button>
        </nav>
      ) : null}
      {quota ? (
        <div
          data-rule-quota
          className="grid shrink-0 grid-cols-2 gap-3 border-t bg-background/70 px-4 py-2 text-xs text-muted-foreground supports-backdrop-filter:bg-background/60"
        >
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="truncate">{t('quotaRulesShort')}</span>
            <span className="font-mono tabular-nums">
              {quota.used.toLocaleString()} / {quota.limit.toLocaleString()}
            </span>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="truncate">{t('quotaRegexShort')}</span>
            <span className="font-mono tabular-nums">
              {quota.regexUsed.toLocaleString()} / {quota.regexLimit.toLocaleString()}
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
