import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArchiveRestoreIcon, DatabaseBackupIcon, ListFilterIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';

import type { Rule } from '@/domain/rules/model';
import { requiredPermissionOrigins } from '@/domain/rules/permissions';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/dialog';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/ui/components/input-group';
import { Toaster } from '@/ui/components/sonner';
import { TooltipProvider } from '@/ui/components/tooltip';
import { useMigrationManager } from '@/ui/hooks/use-migration-manager';
import { useRuleManager } from '@/ui/hooks/use-rule-manager';
import { useI18n } from '@/ui/i18n';
import { LanguageMenu } from '@/ui/i18n/language-menu';
import { DataPanel } from '@/ui/data/data-panel';
import { MigrationPanel } from '@/ui/migration/migration-panel';
import { AppSidebar, type OptionsView } from '@/ui/rules/app-sidebar';
import { EmptyRules } from '@/ui/rules/empty-rules';
import { ruleMatchesQuery } from '@/ui/rules/filter-rules';
import { RuleEditor } from '@/ui/rules/rule-editor';
import { RuleList } from '@/ui/rules/rule-list';
import { cn } from '@/ui/lib/utils';
import { errorMessage } from '@/ui/lib/error-message';

export function OptionsApp() {
  const { t } = useI18n();
  const manager = useRuleManager();
  const migrationManager = useMigrationManager();
  const [view, setView] = useState<OptionsView>('rules');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [editorDirty, setEditorDirty] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [pendingPermissionRule, setPendingPermissionRule] = useState<Rule | null>(null);
  const [pendingRuleIds, setPendingRuleIds] = useState<Set<string>>(() => new Set());
  const searchInput = useRef<HTMLInputElement>(null);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const selectedRule = useMemo(
    () => manager.rules.find((rule) => rule.id === manager.selectedId) ?? null,
    [manager.rules, manager.selectedId],
  );
  const hasRules = manager.rules.length > 0;
  const migrationCount =
    migrationManager.migration?.status === 'pending'
      ? migrationManager.migration.bundle.report.items.length
      : 0;

  const handleDirtyChange = useCallback((dirty: boolean) => {
    setEditorDirty(dirty);
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (view !== 'rules' || (!event.metaKey && !event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      searchInput.current?.focus();
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, [view]);

  const requestNavigation = useCallback(
    (action: () => void) => {
      if (!editorDirty) {
        action();
        return;
      }
      pendingNavigation.current = action;
      setDiscardOpen(true);
    },
    [editorDirty],
  );

  const keepEditing = () => {
    pendingNavigation.current = null;
    setDiscardOpen(false);
  };

  const discardAndContinue = () => {
    const action = pendingNavigation.current;
    pendingNavigation.current = null;
    setEditorDirty(false);
    setDiscardOpen(false);
    action?.();
  };

  const handleQueryChange = (nextQuery: string) => {
    if (selectedRule && !ruleMatchesQuery(selectedRule, nextQuery, t)) {
      requestNavigation(() => {
        setQuery(nextQuery);
        manager.setSelectedId(null);
      });
      return;
    }
    setQuery(nextQuery);
  };

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      await manager.addRule(undefined, t('untitledRule'));
    } catch (error) {
      toast.error(errorMessage(error, t('createRuleError')));
    } finally {
      setCreating(false);
    }
  };

  const performToggle = async (id: string, enabled: boolean) => {
    if (pendingRuleIds.has(id)) return;
    setPendingRuleIds((current) => new Set(current).add(id));
    try {
      const result = await manager.toggleRule(id, enabled);
      if (enabled && !result.quotaAvailable) {
        toast.error(t('quotaExceeded'));
      } else if (enabled && !result.cycleFree) {
        toast.error(t('redirectCycleBlocked'));
      } else if (enabled && !result.regexSupported) {
        toast.error(t('regexUnsupported', { reason: result.regexReason ?? t('unknownReason') }));
      } else if (enabled && !result.permissionGranted) {
        toast.warning(t('enabledNeedsPermission'));
      }
    } catch (error) {
      toast.error(errorMessage(error, t('changeRuleStateError')));
    } finally {
      setPendingRuleIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggle = (id: string, enabled: boolean) => {
    const rule = manager.state?.rules[id];
    if (enabled && manager.statuses[id] === 'invalid') {
      manager.setSelectedId(id);
      toast.error(t('invalidRuleCannotEnable'));
      return;
    }
    if (enabled && rule && manager.permissions[id] !== true && requiredPermissionOrigins(rule).length > 0) {
      setPendingPermissionRule(rule);
      return;
    }
    void performToggle(id, enabled);
  };

  if (manager.loading || !manager.state) {
    return (
      <main className="grid min-h-screen place-items-center bg-muted/30">
        <p className="text-sm text-muted-foreground">{t('loadingRules')}</p>
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
            <span className="text-lg font-semibold tracking-tight max-[1049px]:hidden max-[799px]:inline max-[479px]:sr-only">
              {t('appName')}
            </span>
            <span
              className="hidden text-base font-semibold max-[1049px]:inline max-[799px]:hidden"
              aria-label={t('appName')}
            >
              RR
            </span>
          </div>
          <div className="border-r px-3 max-[799px]:hidden">
            {view === 'rules' ? (
              <InputGroup>
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  ref={searchInput}
                  aria-label={t('searchRules')}
                  placeholder={t('searchRules')}
                  value={query}
                  onChange={(event) => handleQueryChange(event.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <kbd aria-hidden="true">⌘K</kbd>
                </InputGroupAddon>
              </InputGroup>
            ) : (
              <p className="px-2 text-sm font-medium">
                {t(view === 'migration' ? 'reviewLegacyData' : 'dataIntro')}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 px-4 max-[799px]:px-3">
            <div className="min-[800px]:hidden">
              <LanguageMenu />
            </div>
            {view === 'rules' ? (
              <>
                <Button
                  className="min-[800px]:hidden"
                  variant="outline"
                  aria-label={t('openMigration')}
                  onClick={() => requestNavigation(() => setView('migration'))}
                >
                  <ArchiveRestoreIcon />
                  <span className="max-[479px]:sr-only">{t('migration')}</span>
                  {migrationCount > 0 ? <Badge variant="warning">{migrationCount}</Badge> : null}
                </Button>
                <Button
                  className="min-[800px]:hidden"
                  variant="outline"
                  aria-label={t('dataManagement')}
                  onClick={() => requestNavigation(() => setView('data'))}
                >
                  <DatabaseBackupIcon />
                  <span className="sr-only">{t('dataManagement')}</span>
                </Button>
              </>
            ) : (
              <Button
                className="min-[800px]:hidden"
                variant="outline"
                aria-label={t('openRules')}
                onClick={() => requestNavigation(() => setView('rules'))}
              >
                <ListFilterIcon />
                <span className="max-[479px]:sr-only">{t('rules')}</span>
              </Button>
            )}
            {view === 'rules' ? (
              <Button disabled={creating} onClick={() => requestNavigation(() => void handleCreate())}>
                <PlusIcon data-icon="inline-start" />
                {creating ? t('creating') : t('newRule')}
              </Button>
            ) : null}
          </div>
        </header>

        <div className="grid min-h-0 min-w-0 grid-cols-[220px_minmax(320px,420px)_minmax(0,1fr)] max-[1049px]:grid-cols-[64px_340px_minmax(0,1fr)] max-[799px]:grid-cols-1">
          <AppSidebar
            view={view}
            migrationCount={migrationCount}
            onViewChange={(nextView) => requestNavigation(() => setView(nextView))}
          />
          {view === 'migration' ? (
            <MigrationPanel
              key={`${migrationManager.migration?.bundle.report.sourceFingerprint ?? 'none'}:${migrationManager.migration?.status ?? 'none'}`}
              migration={migrationManager.migration}
              importPreview={migrationManager.importPreview}
              detection={migrationManager.detection}
              detectedFingerprint={migrationManager.detectedFingerprint}
              loading={migrationManager.loading}
              busy={migrationManager.busy}
              error={migrationManager.error}
              onPreviewImport={migrationManager.previewLegacyImport}
              onConfirmImport={migrationManager.confirmImportPreview}
              onCancelImport={migrationManager.cancelImportPreview}
              onApply={(selectedIds) => migrationManager.applySelected(manager.state!, selectedIds)}
              onRollback={() => migrationManager.rollback(manager.state!)}
              onStateCommitted={manager.adoptState}
            />
          ) : view === 'data' ? (
            <DataPanel
              state={manager.state}
              recovery={manager.importRecovery}
              onCommit={manager.replaceStateFromImport}
              onRestore={manager.restoreImportRecovery}
            />
          ) : hasRules ? (
            <>
              <div className={cn(selectedRule && 'max-[799px]:hidden')}>
                <RuleList
                  query={query}
                  rules={manager.rules}
                  selectedId={manager.selectedId}
                  statuses={manager.statuses}
                  pendingIds={pendingRuleIds}
                  quota={manager.quota}
                  onQueryChange={handleQueryChange}
                  onSelect={(id) => requestNavigation(() => manager.setSelectedId(id))}
                  onToggle={handleToggle}
                />
              </div>
              {selectedRule ? (
                <RuleEditor
                  key={`${selectedRule.id}:${selectedRule.updatedAt}`}
                  rule={selectedRule}
                  status={manager.statuses[selectedRule.id] ?? 'disabled'}
                  hasPermission={manager.permissions[selectedRule.id] === true}
                  diagnostics={manager.diagnostics[selectedRule.id] ?? []}
                  ruleIndex={manager.state.order.indexOf(selectedRule.id)}
                  onBack={() => requestNavigation(() => manager.setSelectedId(null))}
                  onCopy={manager.copyRule}
                  onDelete={manager.deleteRule}
                  onDirtyChange={handleDirtyChange}
                  onRestore={manager.undoDeleteRule}
                  onSave={manager.saveRule}
                />
              ) : (
                <section className="hidden place-items-center p-8 text-center min-[800px]:grid">
                  <div className="flex max-w-sm flex-col gap-2">
                    <h1 className="text-xl font-semibold">{t('selectRule')}</h1>
                    <p className="text-sm text-muted-foreground">{t('selectRuleDescription')}</p>
                  </div>
                </section>
              )}
            </>
          ) : (
            <EmptyRules onCreate={() => void handleCreate()} />
          )}
        </div>
      </main>
      <Dialog
        open={discardOpen}
        onOpenChange={(open) => {
          if (!open) keepEditing();
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('unsavedTitle')}</DialogTitle>
            <DialogDescription>{t('unsavedDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={keepEditing}>
              {t('keepEditing')}
            </Button>
            <Button variant="destructive" onClick={discardAndContinue}>
              {t('discardChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(pendingPermissionRule)}
        onOpenChange={(open) => {
          if (!open) setPendingPermissionRule(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('permissionRequestTitle', { name: pendingPermissionRule?.name ?? '' })}
            </DialogTitle>
            <DialogDescription>{t('permissionRequestDescription')}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/35 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">{t('permissionRequestScope')}</p>
            <p className="font-mono text-sm break-all">
              {pendingPermissionRule ? requiredPermissionOrigins(pendingPermissionRule).join(', ') : ''}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingPermissionRule(null)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={() => {
                const rule = pendingPermissionRule;
                setPendingPermissionRule(null);
                if (rule) void performToggle(rule.id, true);
              }}
            >
              {t('requestAccess')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster position="bottom-right" richColors />
    </TooltipProvider>
  );
}
