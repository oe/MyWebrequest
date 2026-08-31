import { useRef, useState } from 'react';
import { CheckCircle2Icon, CircleAlertIcon, DownloadIcon, UploadIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  createRuleBackup,
  createRuleImportPreview,
  parseRuleBackup,
  type ParsedRuleBackup,
  type RuleImportMode,
  type RuleImportPreview,
} from '@/application/rule-backup';
import type { StoredState } from '@/domain/rules/model';
import type { RuleImportRecovery } from '@/infrastructure/rule-import-recovery';
import { Alert, AlertDescription, AlertTitle } from '@/ui/components/alert';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/dialog';
import { ScrollArea } from '@/ui/components/scroll-area';
import { Separator } from '@/ui/components/separator';
import { useI18n } from '@/ui/i18n';
import type { MessageKey } from '@/ui/i18n/messages';
import { downloadJson } from '@/ui/lib/download-json';

type DataPanelProps = {
  state: StoredState;
  recovery: RuleImportRecovery | null;
  onCommit: (state: StoredState, mode: RuleImportMode) => Promise<void>;
  onRestore: () => Promise<void>;
};

export function DataPanel({ state, recovery, onCommit, onRestore }: DataPanelProps) {
  const { locale, t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedRuleBackup | null>(null);
  const [preview, setPreview] = useState<RuleImportPreview | null>(null);
  const [mode, setMode] = useState<RuleImportMode>('merge');
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const previewCounts = preview
    ? ([
        [preview.sourceRuleCount, 'sourceRuleCount'],
        [preview.addCount, 'rulesAdded'],
        [preview.updateCount, 'rulesUpdated'],
        [preview.skipCount, 'rulesSkipped'],
        [preview.conflictCount, 'conflictCount'],
        [preview.deleteCount, 'rulesDeleted'],
      ] satisfies Array<readonly [number, MessageKey]>)
    : [];

  const preparePreview = async (source: ParsedRuleBackup, nextMode: RuleImportMode) => {
    const next = await createRuleImportPreview(state, source, nextMode, new Date().toISOString());
    setMode(nextMode);
    setPreview(next);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const backup = await createRuleBackup(state, new Date().toISOString());
      downloadJson(backup, `my-webrequest-rules-${backup.exportedAt.slice(0, 10)}.json`);
    } catch {
      toast.error(t('exportBackupError'));
    } finally {
      setExporting(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const source = await parseRuleBackup(await file.text());
      setParsed(source);
      await preparePreview(source, 'merge');
    } catch {
      setParsed(null);
      setPreview(null);
      toast.error(t('importBackupError'));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const handleMode = async (nextMode: RuleImportMode) => {
    if (!parsed || busy || nextMode === mode) return;
    setBusy(true);
    try {
      await preparePreview(parsed, nextMode);
    } catch {
      toast.error(t('importBackupError'));
    } finally {
      setBusy(false);
    }
  };

  const handleApply = async () => {
    if (!parsed || !preview || busy) return;
    setBusy(true);
    try {
      const currentPreview = await createRuleImportPreview(state, parsed, mode, new Date().toISOString());
      await onCommit(currentPreview.nextState, mode);
      toast.success(t('importComplete', { count: currentPreview.importedRuleCount }));
      setParsed(null);
      setPreview(null);
    } catch {
      toast.error(t('importBackupError'));
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onRestore();
      setRestoreOpen(false);
      toast.success(t('restoreImportComplete'));
    } catch {
      toast.error(t('restoreImportError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      data-material="glass-content"
      className="col-span-2 flex min-h-0 flex-col max-[799px]:col-span-1"
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{t('dataManagement')}</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t('dataIntro')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={exporting} onClick={() => void handleExport()}>
                <DownloadIcon data-icon="inline-start" />
                {exporting ? t('exportingBackup') : t('exportBackup')}
              </Button>
              <input
                ref={input}
                className="sr-only"
                type="file"
                accept="application/json,.json"
                aria-label={t('chooseBackupFile')}
                disabled={busy}
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
              <Button disabled={busy} onClick={() => input.current?.click()}>
                <UploadIcon data-icon="inline-start" />
                {t('importBackup')}
              </Button>
            </div>
          </div>

          {recovery ? (
            <Alert variant="warning">
              <CircleAlertIcon />
              <AlertTitle>{t('recoveryAvailable')}</AlertTitle>
              <AlertDescription>
                <p>
                  {t('recoveryAvailableHelp', {
                    date: new Intl.DateTimeFormat(locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(recovery.createdAt)),
                  })}
                </p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => setRestoreOpen(true)}>
                  {t('restoreImportedState')}
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {parsed && preview ? (
            <div className="space-y-5 rounded-xl border bg-background/35 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{t('importPreviewTitle')}</h2>
                <Badge variant={parsed.integrity === 'verified' ? 'success' : 'warning'}>
                  {parsed.integrity === 'verified' ? t('verifiedBackup') : t('unverifiedBackup')}
                </Badge>
              </div>
              {parsed.integrity === 'legacy-unverified' ? (
                <Alert variant="warning">
                  <CircleAlertIcon />
                  <AlertTitle>{t('unverifiedBackup')}</AlertTitle>
                  <AlertDescription>{t('unverifiedBackupHelp')}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {previewCounts.map(([count, label]) => (
                  <div key={label} className="rounded-lg border bg-background/50 p-3">
                    <p className="text-xl font-semibold tabular-nums">{count}</p>
                    <p className="text-xs text-muted-foreground">{t(label)}</p>
                  </div>
                ))}
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">{t('importMode')}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(['merge', 'replace'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={mode === value}
                      className="rounded-xl border bg-background/45 p-4 text-left transition-colors outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary/50 aria-pressed:bg-accent"
                      disabled={busy}
                      onClick={() => void handleMode(value)}
                    >
                      <span className="block text-sm font-medium">
                        {t(value === 'merge' ? 'mergeImport' : 'replaceImport')}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {t(value === 'merge' ? 'mergeImportHelp' : 'replaceImportHelp')}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {mode === 'replace' ? (
                <Alert variant="warning">
                  <CircleAlertIcon />
                  <AlertTitle>{t('replaceWarningTitle')}</AlertTitle>
                  <AlertDescription>{t('replaceWarningDescription')}</AlertDescription>
                </Alert>
              ) : null}
              <Alert variant="success">
                <CheckCircle2Icon />
                <AlertDescription>{t('importedRulesDisabled')}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
              <p className="max-w-md text-sm leading-6 text-muted-foreground">{t('dataIntro')}</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {preview ? (
        <>
          <Separator />
          <footer data-material="glass-toolbar" className="flex justify-end gap-2 p-4 lg:px-8">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setParsed(null);
                setPreview(null);
              }}
            >
              {t('cancelImport')}
            </Button>
            <Button disabled={busy} onClick={() => void handleApply()}>
              {busy ? t('applyingImport') : t('applyImport')}
            </Button>
          </footer>
        </>
      ) : null}

      <Dialog open={restoreOpen} onOpenChange={(open) => !busy && setRestoreOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('restoreImportTitle')}</DialogTitle>
            <DialogDescription>{t('restoreImportDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={busy}>
                {t('cancel')}
              </Button>
            </DialogClose>
            <Button variant="destructive" disabled={busy} onClick={() => void handleRestore()}>
              {busy ? t('restoringImport') : t('restoreImportedState')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
