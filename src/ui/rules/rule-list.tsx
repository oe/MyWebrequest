import { ChevronRightIcon, SearchIcon } from 'lucide-react';

import type { Rule, RuleStatus } from '@/src/domain/rules/model';
import { actionLabel } from '@/src/domain/rules/model';
import { Badge } from '@/src/ui/components/badge';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/src/ui/components/input-group';
import { ScrollArea } from '@/src/ui/components/scroll-area';
import { Separator } from '@/src/ui/components/separator';
import { Switch } from '@/src/ui/components/switch';
import { cn } from '@/src/ui/lib/utils';
import { StatusBadge } from './status-badge';

type RuleListProps = {
  query: string;
  rules: Rule[];
  selectedId: string | null;
  statuses: Record<string, RuleStatus>;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
};

const sections: Array<{ label: string; statuses: RuleStatus[] }> = [
  { label: 'Enabled', statuses: ['active', 'needs-permission', 'disabled', 'invalid'] },
  { label: 'Needs review', statuses: ['review-required', 'unsupported'] },
  { label: 'Removed', statuses: ['removed'] },
];

export function RuleList({
  query,
  rules,
  selectedId,
  statuses,
  onQueryChange,
  onSelect,
  onToggle,
}: RuleListProps) {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = rules.filter((rule) =>
    [rule.name, actionLabel(rule.action), rule.condition.url.value].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    ),
  );

  return (
    <section
      aria-label="Rules"
      className="flex min-h-0 flex-col border-r bg-background max-[799px]:border-r-0"
    >
      <div className="border-b p-3 min-[800px]:hidden">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search rules"
            placeholder="Search rules"
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
                            <span>{actionLabel(rule.action)}</span>
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
                          aria-label={`${rule.enabled ? 'Disable' : 'Enable'} ${rule.name}`}
                          checked={rule.enabled}
                          disabled={!editable}
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
            <p className="text-sm font-medium">No matching rules</p>
            <p className="text-sm text-muted-foreground">Try a different name, action, or URL.</p>
          </div>
        ) : null}
      </ScrollArea>
    </section>
  );
}
