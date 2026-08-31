import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRightIcon,
  CirclePauseIcon,
  KeyRoundIcon,
  ListFilterIcon,
  PlusIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/ui/components/alert';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { Separator } from '@/ui/components/separator';
import { Switch } from '@/ui/components/switch';
import { Toaster } from '@/ui/components/sonner';
import { TooltipProvider } from '@/ui/components/tooltip';
import { useRuleManager } from '@/ui/hooks/use-rule-manager';
import { errorMessage } from '@/ui/lib/error-message';

function canUseExtensionTabs(): boolean {
  return typeof browser !== 'undefined' && Boolean(browser.tabs && browser.runtime?.id);
}

async function openRuleManager(): Promise<void> {
  if (canUseExtensionTabs()) {
    await browser.runtime.openOptionsPage();
  }
}

export function PopupApp() {
  const manager = useRuleManager();
  const [origin, setOrigin] = useState('https://api.example.com');
  const [pausing, setPausing] = useState(false);
  const [creating, setCreating] = useState(false);

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
    () =>
      manager.rules.filter((rule) =>
        rule.permissionOrigins.some((permission) => permission.includes(origin.replace(/^https?:\/\//, ''))),
      ),
    [manager.rules, origin],
  );

  if (manager.loading || !manager.state) {
    return <main className="grid min-h-64 place-items-center text-sm text-muted-foreground">Loading…</main>;
  }

  const paused = manager.state.settings.globallyPaused;

  const handlePausedChange = async (checked: boolean) => {
    if (pausing) return;
    setPausing(true);
    try {
      await manager.setGloballyPaused(checked);
    } catch (error) {
      toast.error(errorMessage(error, 'The global rule state could not be changed.'));
    } finally {
      setPausing(false);
    }
  };

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      await manager.addRule(origin);
      await openRuleManager();
    } catch (error) {
      toast.error(errorMessage(error, 'The rule could not be created.'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <TooltipProvider>
      <main data-material="glass-popup" className="flex w-[380px] flex-col">
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
            <AlertTitle>
              {paused
                ? 'All rules are paused'
                : `${scopedRules.length} rule${scopedRules.length === 1 ? '' : 's'} for this site`}
            </AlertTitle>
            <AlertDescription>
              {paused
                ? 'Resume to let enabled rules affect requests again.'
                : 'Rules stay on this device and run through Manifest V3.'}
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
              disabled={pausing}
              onCheckedChange={(checked) => void handlePausedChange(checked)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button disabled={!origin.startsWith('http') || creating} onClick={() => void handleCreate()}>
              <PlusIcon data-icon="inline-start" />
              {creating ? 'Creating…' : 'Create rule for this site'}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                void openRuleManager().catch((error: unknown) =>
                  toast.error(errorMessage(error, 'The rule manager could not be opened.')),
                )
              }
            >
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
        <Toaster position="bottom-center" richColors />
      </main>
    </TooltipProvider>
  );
}
