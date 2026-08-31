import { useMemo, useState } from 'react';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/ui/components/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/ui/components/input-group';
import { Toaster } from '@/ui/components/sonner';
import { TooltipProvider } from '@/ui/components/tooltip';
import { useRuleManager } from '@/ui/hooks/use-rule-manager';
import { AppSidebar } from '@/ui/rules/app-sidebar';
import { RuleEditor } from '@/ui/rules/rule-editor';
import { RuleList } from '@/ui/rules/rule-list';
import { cn } from '@/ui/lib/utils';

export function OptionsApp() {
  const manager = useRuleManager();
  const [query, setQuery] = useState('');
  const selectedRule = useMemo(
    () => manager.rules.find((rule) => rule.id === manager.selectedId) ?? null,
    [manager.rules, manager.selectedId],
  );

  if (manager.loading || !manager.state) {
    return (
      <main className="grid min-h-screen place-items-center bg-muted/30">
        <p className="text-sm text-muted-foreground">Loading request rules…</p>
      </main>
    );
  }

  return (
    <TooltipProvider>
      <main className="grid h-screen min-h-[600px] grid-rows-[64px_minmax(0,1fr)] overflow-hidden">
        <header
          data-material="glass-bar"
          className="relative grid grid-cols-[220px_minmax(320px,420px)_minmax(0,1fr)] items-center border-b max-[1049px]:grid-cols-[64px_340px_minmax(0,1fr)] max-[799px]:grid-cols-[1fr_auto]"
        >
          <div className="flex h-full items-center border-r px-5 max-[1049px]:justify-center max-[1049px]:px-0 max-[799px]:justify-start max-[799px]:border-r-0 max-[799px]:px-4">
            <span className="text-lg font-semibold tracking-tight max-[1049px]:hidden max-[799px]:inline">
              Request Rules
            </span>
            <span
              className="hidden text-base font-semibold max-[1049px]:inline max-[799px]:hidden"
              aria-label="Request Rules"
            >
              RR
            </span>
          </div>
          <div className="border-r px-3 max-[799px]:hidden">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search rules"
                placeholder="Search rules"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <InputGroupAddon align="inline-end">⌘K</InputGroupAddon>
            </InputGroup>
          </div>
          <div className="flex justify-end px-4 max-[799px]:px-3">
            <Button onClick={() => void manager.addRule()}>
              <PlusIcon data-icon="inline-start" />
              New rule
            </Button>
          </div>
        </header>

        <div className="grid min-h-0 grid-cols-[220px_minmax(320px,420px)_minmax(0,1fr)] max-[1049px]:grid-cols-[64px_340px_minmax(0,1fr)] max-[799px]:grid-cols-1">
          <AppSidebar />
          <div className={cn(selectedRule && 'max-[799px]:hidden')}>
            <RuleList
              query={query}
              rules={manager.rules}
              selectedId={manager.selectedId}
              statuses={manager.statuses}
              onQueryChange={setQuery}
              onSelect={manager.setSelectedId}
              onToggle={(id, enabled) => {
                void manager.toggleRule(id, enabled).then((granted) => {
                  if (enabled && !granted) toast.warning('Rule enabled, but it still needs host permission.');
                });
              }}
            />
          </div>
          {selectedRule ? (
            <RuleEditor
              key={`${selectedRule.id}:${selectedRule.updatedAt}`}
              rule={selectedRule}
              status={manager.statuses[selectedRule.id] ?? 'disabled'}
              hasPermission={manager.permissions[selectedRule.id] === true}
              onBack={() => manager.setSelectedId(null)}
              onDelete={manager.deleteRule}
              onSave={manager.saveRule}
            />
          ) : (
            <section className="hidden place-items-center p-8 text-center min-[800px]:grid">
              <div className="flex max-w-sm flex-col gap-2">
                <h1 className="text-xl font-semibold">Select a rule</h1>
                <p className="text-sm text-muted-foreground">
                  Choose a rule from the list or create a new one to start editing.
                </p>
              </div>
            </section>
          )}
        </div>
      </main>
      <Toaster position="bottom-right" richColors />
    </TooltipProvider>
  );
}
