import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRightIcon, CirclePauseIcon, KeyRoundIcon, ListFilterIcon, PlusIcon, ShieldCheckIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/src/ui/components/alert';
import { Badge } from '@/src/ui/components/badge';
import { Button } from '@/src/ui/components/button';
import { Separator } from '@/src/ui/components/separator';
import { Switch } from '@/src/ui/components/switch';
import { TooltipProvider } from '@/src/ui/components/tooltip';
import { useRuleManager } from '@/src/ui/hooks/use-rule-manager';

function canUseExtensionTabs(): boolean {
  return typeof browser !== 'undefined' && Boolean(browser.tabs && browser.runtime?.id);
}

async function openRuleManager(): Promise<void> {
  if (canUseExtensionTabs()) {
    await browser.runtime.openOptionsPage();
  }
}

export function App() {
  const manager = useRuleManager();
  const [origin, setOrigin] = useState('https://api.example.com');

  useEffect(() => {
    if (!canUseExtensionTabs()) return;
    void browser.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (!tab?.url) return;
      try {
        setOrigin(new URL(tab.url).origin);
      } catch {
        setOrigin('Unavailable on this page');
      }
    });
  }, []);

  const scopedRules = useMemo(
    () => manager.rules.filter((rule) => rule.permissionOrigins.some((permission) => permission.includes(origin.replace(/^https?:\/\//, '')))),
    [manager.rules, origin],
  );

  if (manager.loading || !manager.state) {
    return <main className="grid min-h-64 place-items-center text-sm text-muted-foreground">Loading…</main>;
  }

  const paused = manager.state.settings.globallyPaused;

  return (
    <TooltipProvider>
      <main className="flex w-[380px] flex-col bg-background">
        <header className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="size-5" aria-hidden="true" />
            <h1 className="text-base font-semibold">Request Rules</h1>
          </div>
          <Badge variant={paused ? 'warning' : 'success'}>{paused ? 'Paused' : 'Active'}</Badge>
        </header>
        <Separator />

        <section className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground">CURRENT SITE</p>
            <p className="truncate text-sm font-medium">{origin}</p>
          </div>

          <Alert variant={paused ? 'warning' : 'success'}>
            {paused ? <CirclePauseIcon /> : <ShieldCheckIcon />}
            <AlertTitle>{paused ? 'All rules are paused' : `${scopedRules.length} rule${scopedRules.length === 1 ? '' : 's'} for this site`}</AlertTitle>
            <AlertDescription>
              {paused ? 'Resume to let enabled rules affect requests again.' : 'Rules stay on this device and run through Manifest V3.'}
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium">Pause all rules</span>
              <span className="text-xs text-muted-foreground">Keeps your rules saved.</span>
            </div>
            <Switch
              aria-label="Pause all rules"
              checked={paused}
              onCheckedChange={(checked) => void manager.setGloballyPaused(checked)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button
              disabled={!origin.startsWith('http')}
              onClick={() => {
                void manager.addRule(origin).then(openRuleManager);
              }}
            >
              <PlusIcon data-icon="inline-start" />
              Create rule for this site
            </Button>
            <Button variant="outline" onClick={() => void openRuleManager()}>
              <ListFilterIcon data-icon="inline-start" />
              Open rule manager
              <ArrowUpRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </section>

        <Separator />
        <footer className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
          <KeyRoundIcon className="size-4" aria-hidden="true" />
          Host access is requested only when a rule needs it.
        </footer>
      </main>
    </TooltipProvider>
  );
}
