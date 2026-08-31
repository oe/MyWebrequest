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
import { useI18n } from '@/ui/i18n';
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
  const { t } = useI18n();
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
        setOrigin(t('unavailablePage'));
      }
    });
  }, [t]);

  const scopedRules = useMemo(
    () =>
      manager.rules.filter((rule) =>
        rule.permissionOrigins.some((permission) => permission.includes(origin.replace(/^https?:\/\//, ''))),
      ),
    [manager.rules, origin],
  );

  if (manager.loading || !manager.state) {
    return (
      <main className="grid min-h-64 place-items-center text-sm text-muted-foreground">{t('loading')}</main>
    );
  }

  const paused = manager.state.settings.globallyPaused;

  const handlePausedChange = async (checked: boolean) => {
    if (pausing) return;
    setPausing(true);
    try {
      await manager.setGloballyPaused(checked);
    } catch (error) {
      toast.error(errorMessage(error, t('pauseError')));
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
      toast.error(errorMessage(error, t('createRuleError')));
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
            <h1 className="text-base font-semibold">{t('appName')}</h1>
          </div>
          <Badge variant={paused ? 'warning' : 'success'}>
            {t(paused ? 'statusPaused' : 'statusActive')}
          </Badge>
        </header>
        <Separator />

        <section className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-muted-foreground">{t('currentSite')}</p>
            <p className="truncate text-sm font-medium">{origin}</p>
          </div>

          <Alert variant={paused ? 'warning' : 'success'}>
            {paused ? <CirclePauseIcon /> : <ShieldCheckIcon />}
            <AlertTitle>
              {paused
                ? t('allRulesPaused')
                : t(scopedRules.length === 1 ? 'siteRulesOne' : 'siteRulesMany', {
                    count: scopedRules.length,
                  })}
            </AlertTitle>
            <AlertDescription>{paused ? t('resumeRulesHelp') : t('localRulesHelp')}</AlertDescription>
          </Alert>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium">{t('pauseAllRules')}</span>
              <span className="text-xs text-muted-foreground">{t('keepsRulesSaved')}</span>
            </div>
            <Switch
              aria-label={t('pauseAllRules')}
              checked={paused}
              disabled={pausing}
              onCheckedChange={(checked) => void handlePausedChange(checked)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button disabled={!origin.startsWith('http') || creating} onClick={() => void handleCreate()}>
              <PlusIcon data-icon="inline-start" />
              {creating ? t('creating') : t('createSiteRule')}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                void openRuleManager().catch((error: unknown) =>
                  toast.error(errorMessage(error, t('openRuleManagerError'))),
                )
              }
            >
              <ListFilterIcon data-icon="inline-start" />
              {t('openRuleManager')}
              <ArrowUpRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </section>

        <Separator />
        <footer className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
          <KeyRoundIcon className="size-4" aria-hidden="true" />
          {t('hostAccessOnDemand')}
        </footer>
        <Toaster position="bottom-center" richColors />
      </main>
    </TooltipProvider>
  );
}
