import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRightIcon,
  CircleSlash2Icon,
  CirclePauseIcon,
  KeyRoundIcon,
  ListFilterIcon,
  PlusIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { ruleMatchesOrigin } from '@/domain/rules/origin-scope';
import { requiredPermissionOrigins } from '@/domain/rules/permissions';
import { validateRule } from '@/domain/rules/validate';
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
import { supportedPageOrigin } from '@/ui/lib/supported-page';

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
      if (!tab?.url) {
        setOrigin('');
        return;
      }
      setOrigin(supportedPageOrigin(tab.url) ?? '');
    });
  }, []);

  const pageSupported = origin.startsWith('http://') || origin.startsWith('https://');

  const scopedEnabledRules = useMemo(
    () =>
      manager.rules.filter(
        (rule) =>
          rule.enabled &&
          rule.migrationState === 'none' &&
          validateRule(rule).valid &&
          pageSupported &&
          ruleMatchesOrigin(rule, origin),
      ),
    [manager.rules, origin, pageSupported],
  );
  const permissionScopedRules = scopedEnabledRules.filter(
    (rule) => requiredPermissionOrigins(rule).length > 0,
  );
  const siteAccessState = !pageSupported
    ? 'unavailable'
    : permissionScopedRules.length === 0
      ? 'not-needed'
      : permissionScopedRules.every((rule) => manager.permissions[rule.id] === true)
        ? 'granted'
        : 'required';

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
    if (creating || !pageSupported) return;
    setCreating(true);
    try {
      await manager.addRule(origin, t('untitledRule'));
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
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-xs font-medium text-muted-foreground">{t('currentSite')}</p>
              <p className="truncate text-sm font-medium">{pageSupported ? origin : t('unavailablePage')}</p>
            </div>
            <Badge
              variant={
                siteAccessState === 'required'
                  ? 'warning'
                  : siteAccessState === 'unavailable'
                    ? 'muted'
                    : 'secondary'
              }
            >
              {t(
                siteAccessState === 'unavailable'
                  ? 'statusUnsupported'
                  : siteAccessState === 'granted'
                    ? 'hostAccessGranted'
                    : siteAccessState === 'required'
                      ? 'hostAccessRequired'
                      : 'hostAccessNotNeeded',
              )}
            </Badge>
          </div>

          {pageSupported ? (
            <Alert variant={paused ? 'warning' : 'success'}>
              {paused ? <CirclePauseIcon /> : <ShieldCheckIcon />}
              <AlertTitle>
                {paused
                  ? t('allRulesPaused')
                  : t(scopedEnabledRules.length === 1 ? 'siteRulesOne' : 'siteRulesMany', {
                      count: scopedEnabledRules.length,
                    })}
              </AlertTitle>
              <AlertDescription>{paused ? t('resumeRulesHelp') : t('localRulesHelp')}</AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CircleSlash2Icon />
              <AlertTitle>{t('unsupportedPageTitle')}</AlertTitle>
              <AlertDescription>{t('unsupportedPageDescription')}</AlertDescription>
            </Alert>
          )}

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
            <Button disabled={!pageSupported || creating} onClick={() => void handleCreate()}>
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
