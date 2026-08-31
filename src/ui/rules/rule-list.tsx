import { ChevronRightIcon, SearchIcon } from 'lucide-react';

import type { Rule, RuleStatus } from '@/domain/rules/model';
import { Badge } from '@/ui/components/badge';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/ui/components/input-group';
import { ScrollArea } from '@/ui/components/scroll-area';
import { Separator } from '@/ui/components/separator';
import { Switch } from '@/ui/components/switch';
import { useI18n, type Translate } from '@/ui/i18n';
import { cn } from '@/ui/lib/utils';
import { StatusBadge } from './status-badge';

type RuleListProps = {
  query: string;
  rules: Rule[];
  selectedId: string | null;
  statuses: Record<string, RuleStatus>;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
  pendingIds?: ReadonlySet<string>;
};

function localizedActionLabel(action: Rule['action'], t: Translate): string {
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

export function RuleList({
  query,
  rules,
  selectedId,
  statuses,
  onQueryChange,
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
        'disabled',
        'invalid',
      ],
    },
    { label: t('needsReviewSection'), statuses: ['review-required', 'unsupported'] },
    { label: t('removedSection'), statuses: ['removed'] },
  ];
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = rules.filter((rule) =>
    [rule.name, localizedActionLabel(rule.action, t), rule.condition.url.value].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    ),
  );

  return (
    <section
      aria-label={t('rules')}
      data-material="glass-content"
      className="flex min-h-0 flex-col border-r max-[799px]:border-r-0"
    >
      <div className="border-b p-3 min-[800px]:hidden">
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
      <ScrollArea className="min-h-0 flex-1">
        {sections.map((section) => {
          const sectionRules = filtered.filter((rule) =>
            section.statuses.includes(statuses[rule.id] ?? 'disabled'),
          );
          if (sectionRules.length === 0) return null;
          return (
            <div key={section.label}>
              <div className="flex h-11 items-center gap-2 bg-muted/35 px-5 text-sm font-medium">
                <span>{section.label}</span>
                <Badge variant="secondary">{sectionRules.length}</Badge>
              </div>
              <Separator />
              <div role="list">
                {sectionRules.map((rule) => {
                  const selected = selectedId === rule.id;
                  const status = statuses[rule.id] ?? 'disabled';
                  const editable = rule.migrationState !== 'removed' && rule.migrationState !== 'unsupported';
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
                        aria-current={selected ? 'true' : undefined}
                        className="flex min-w-0 items-center gap-3 self-stretch px-5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                        onClick={() => onSelect(rule.id)}
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="truncate text-sm font-medium">{rule.name}</span>
                          <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                            <span>{localizedActionLabel(rule.action, t)}</span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate font-mono">{rule.condition.url.value}</span>
                          </span>
                          <StatusBadge status={status} />
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
    </section>
  );
}
