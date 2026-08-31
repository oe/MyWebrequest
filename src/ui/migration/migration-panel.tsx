import { useMemo, useRef, useState } from 'react';
import {
  BanIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  DownloadIcon,
  FileJsonIcon,
  RotateCcwIcon,
  UploadIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import type { StoredMigration } from '@/application/migration-apply';
import type { MigrationItem, MigrationOutcome } from '@/domain/migration/model';
import type { StoredState } from '@/domain/rules/model';
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
import { Switch } from '@/ui/components/switch';
import { downloadJson } from '@/ui/lib/download-json';
import { errorMessage } from '@/ui/lib/error-message';
import { cn } from '@/ui/lib/utils';

type Filter = 'all' | MigrationOutcome;

type MigrationPanelProps = {
  migration: StoredMigration | null;
  importPreview: StoredMigration | null;
  detection: 'none' | 'staged' | 'existing' | 'source-changed';
  detectedFingerprint: string | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  onPreviewImport: (text: string) => Promise<StoredMigration>;
  onConfirmImport: () => Promise<void>;
  onCancelImport: () => void;
  onApply: (selectedIds: readonly string[]) => Promise<StoredState | null>;
  onRollback: () => Promise<StoredState | null>;
  onStateCommitted: (state: StoredState) => Promise<void>;
};

const outcomeConfig: Record<
  MigrationOutcome,
  { label: string; variant: 'success' | 'warning' | 'destructive' | 'muted' }
> = {
  automatic: { label: 'Automatic', variant: 'success' },
  'review-required': { label: 'Needs review', variant: 'warning' },
  unsupported: { label: 'Unsupported', variant: 'destructive' },
  'removed-feature': { label: 'Removed feature', variant: 'muted' },
  invalid: { label: 'Invalid', variant: 'destructive' },
};

const outcomes: MigrationOutcome[] = [
  'automatic',
  'review-required',
  'unsupported',
  'removed-feature',
  'invalid',
];
const filterOrder: Filter[] = ['all', ...outcomes];

function sourceText(item: MigrationItem): string {
  if (item.sourceValue === null) {
    return item.sourceByteLength
      ? `Source omitted from the bounded snapshot (${item.sourceByteLength.toLocaleString()} bytes).`
      : 'Source value unavailable.';
  }
  return typeof item.sourceValue === 'string' ? item.sourceValue : JSON.stringify(item.sourceValue, null, 2);
}

function summaryCount(migration: StoredMigration, filter: Filter): number {
  if (filter === 'all') return migration.bundle.report.items.length;
  return migration.bundle.report.items.filter((item) => item.outcome === filter).length;
}

function filterLabel(filter: Filter): string {
  return filter === 'all' ? 'All' : outcomeConfig[filter].label;
}

function MigrationItemRow({
  item,
  selected,
  disabled,
  onSelectedChange,
}: {
  item: MigrationItem;
  selected: boolean;
  disabled: boolean;
  onSelectedChange: (selected: boolean) => void;
}) {
  const applicable = Boolean(item.candidateRule) && ['automatic', 'review-required'].includes(item.outcome);
  const config = outcomeConfig[item.outcome];
  const raw = sourceText(item);
  return (
    <article
      className="grid gap-3 border-b px-5 py-4 [contain-intrinsic-size:0_150px] [content-visibility:auto] last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto]"
      aria-labelledby={`${item.id}-title`}
    >
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id={`${item.id}-title`} className="truncate text-sm font-medium">
            {item.sourceLocator}
          </h3>
          <Badge variant={config.variant}>{config.label}</Badge>
          {item.enabledIntent ? <Badge variant="outline">Previously enabled</Badge> : null}
        </div>
        <p className="text-sm leading-5 text-muted-foreground">{item.explanation}</p>
        <code className="block max-h-28 overflow-auto rounded-md bg-muted/55 px-3 py-2 text-xs leading-5 break-all whitespace-pre-wrap">
          {raw}
        </code>
        {item.candidateRule ? (
          <div className="grid gap-1 text-xs text-muted-foreground">
            <span>
              Candidate: <span className="font-mono">{item.candidateRule.condition.url.value}</span>
            </span>
            <span>This rule will be imported disabled and will request no permission yet.</span>
          </div>
        ) : null}
      </div>
      <div className="flex items-start justify-end pt-1">
        {applicable ? (
          <Switch
            aria-label={`${selected ? 'Exclude' : 'Include'} ${item.sourceLocator}`}
            checked={selected}
            disabled={disabled}
            onCheckedChange={onSelectedChange}
          />
        ) : (
          <BanIcon className="size-4 text-muted-foreground" aria-label="Cannot be imported" />
        )}
      </div>
    </article>
  );
}

export function MigrationPanel({
  migration,
  importPreview,
  detection,
  detectedFingerprint,
  loading,
  busy,
  error,
  onPreviewImport,
  onConfirmImport,
  onCancelImport,
  onApply,
  onRollback,
  onStateCommitted,
}: MigrationPanelProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [visibleCount, setVisibleCount] = useState(100);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(migration?.selectedItemIds ?? []),
  );

  const filteredItems = useMemo(() => {
    if (!migration) return [];
    return migration.bundle.report.items.filter((item) => filter === 'all' || item.outcome === filter);
  }, [filter, migration]);
  const visibleItems = filteredItems.slice(0, visibleCount);
  const pending = migration?.status === 'pending';
  const applied = migration?.status === 'applied';

  const changeFilter = (nextFilter: Filter) => {
    setFilter(nextFilter);
    setVisibleCount(100);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      await onPreviewImport(await file.text());
      toast.success('Legacy import preview is ready.');
    } catch (caught) {
      toast.error(errorMessage(caught, 'The legacy file could not be read.'));
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const handleApply = async () => {
    try {
      const nextState = await onApply([...selectedIds]);
      if (nextState) await onStateCommitted(nextState);
      toast.success(
        `Migration completed with ${selectedIds.size} imported rule${selectedIds.size === 1 ? '' : 's'}.`,
      );
    } catch (caught) {
      toast.error(errorMessage(caught, 'The migration could not be applied.'));
    }
  };

  const handleConfirmImport = async () => {
    try {
      await onConfirmImport();
      toast.success('The imported migration report is now staged.');
    } catch (caught) {
      toast.error(errorMessage(caught, 'The imported report could not be staged.'));
    }
  };

  const handleRollback = async () => {
    try {
      const previousState = await onRollback();
      if (previousState) await onStateCommitted(previousState);
      setRollbackOpen(false);
      toast.success('The pre-migration rule snapshot was restored.');
    } catch (caught) {
      toast.error(errorMessage(caught, 'The migration could not be rolled back.'));
    }
  };

  if (loading) {
    return (
      <section className="col-span-2 grid place-items-center text-sm text-muted-foreground">
        Checking legacy data…
      </section>
    );
  }

  return (
    <section
      data-material="glass-content"
      className="col-span-2 flex min-h-0 flex-col max-[799px]:col-span-1"
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Legacy migration</h1>
                {migration ? <Badge variant="outline">{migration.status}</Badge> : null}
              </div>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Review old My Webrequest data before anything is added. Unsupported data remains available in
                the exported snapshot and is never activated.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInput}
                className="sr-only"
                type="file"
                accept="application/json,.json"
                aria-label="Choose legacy JSON file"
                disabled={busy || applied}
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />
              <Button variant="outline" disabled={busy || applied} onClick={() => fileInput.current?.click()}>
                <UploadIcon data-icon="inline-start" />
                Import legacy JSON
              </Button>
              {migration ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    downloadJson(
                      {
                        exportVersion: 1,
                        kind: 'my-webrequest-legacy-migration',
                        ...migration.bundle,
                      },
                      `my-webrequest-migration-${migration.bundle.report.sourceFingerprint.slice(0, 12)}.json`,
                    )
                  }
                >
                  <DownloadIcon data-icon="inline-start" />
                  Export report
                </Button>
              ) : null}
            </div>
          </div>

          {error ? (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Migration operation failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {detection === 'source-changed' ? (
            <Alert variant="warning">
              <CircleAlertIcon />
              <AlertTitle>Legacy source changed after this report was staged</AlertTitle>
              <AlertDescription>
                The existing report was preserved. Export or finish it before importing the newer source
                fingerprint {detectedFingerprint?.slice(0, 12)}.
              </AlertDescription>
            </Alert>
          ) : null}

          {importPreview ? (
            <Alert variant="warning">
              <FileJsonIcon />
              <AlertTitle>Replace the staged report with this import preview?</AlertTitle>
              <AlertDescription>
                <p>
                  {importPreview.bundle.report.items.length} source items were classified. Active rules will
                  not change until you apply the new report.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button disabled={busy} onClick={() => void handleConfirmImport()}>
                    Confirm preview
                  </Button>
                  <Button variant="outline" disabled={busy} onClick={onCancelImport}>
                    Cancel
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : null}

          {!migration ? (
            <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
              <div className="flex max-w-md flex-col items-center gap-4">
                <div className="grid size-12 place-items-center rounded-2xl border bg-background/60">
                  <CheckCircle2Icon className="size-5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">No legacy data detected</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    If this browser used a different extension ID, import a JSON backup from the old
                    extension.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Migration summary">
                {outcomes.map((outcome) => {
                  const config = outcomeConfig[outcome];
                  return (
                    <button
                      key={outcome}
                      type="button"
                      aria-pressed={filter === outcome}
                      className={cn(
                        'rounded-xl border bg-background/45 p-4 text-left transition-colors outline-none hover:bg-muted/45 focus-visible:ring-3 focus-visible:ring-ring/50',
                        filter === outcome && 'border-primary/40 bg-accent',
                      )}
                      onClick={() => changeFilter(outcome)}
                    >
                      <span className="text-2xl font-semibold tabular-nums">
                        {summaryCount(migration, outcome)}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{config.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="overflow-hidden rounded-xl border bg-background/35">
                <div className="flex flex-col justify-between gap-3 border-b p-4 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap gap-2" aria-label="Filter migration items">
                    {filterOrder.map((value) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={filter === value ? 'secondary' : 'ghost'}
                        aria-pressed={filter === value}
                        onClick={() => changeFilter(value)}
                      >
                        {filterLabel(value)}
                        <Badge variant="muted">{summaryCount(migration, value)}</Badge>
                      </Button>
                    ))}
                  </div>
                  {pending ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setSelectedIds(
                          new Set(
                            migration.bundle.report.items
                              .filter((item) => item.outcome === 'automatic' && item.candidateRule)
                              .map((item) => item.id),
                          ),
                        )
                      }
                    >
                      Reset to automatic
                    </Button>
                  ) : null}
                </div>

                <div>
                  {visibleItems.map((item) => (
                    <MigrationItemRow
                      key={item.id}
                      item={item}
                      selected={selectedIds.has(item.id)}
                      disabled={!pending || busy}
                      onSelectedChange={(selected) =>
                        setSelectedIds((current) => {
                          const next = new Set(current);
                          if (selected) next.add(item.id);
                          else next.delete(item.id);
                          return next;
                        })
                      }
                    />
                  ))}
                  {visibleItems.length === 0 ? (
                    <p className="p-8 text-center text-sm text-muted-foreground">
                      No items in this category.
                    </p>
                  ) : null}
                </div>
                {visibleItems.length < filteredItems.length ? (
                  <div className="border-t p-3 text-center">
                    <Button variant="ghost" onClick={() => setVisibleCount((count) => count + 100)}>
                      Show 100 more
                    </Button>
                  </div>
                ) : null}
              </div>

              <Alert variant={applied ? 'success' : 'default'}>
                {applied ? <CheckCircle2Icon /> : <CircleAlertIcon />}
                <AlertTitle>{applied ? 'Migration applied' : 'Review before applying'}</AlertTitle>
                <AlertDescription>
                  {applied
                    ? `${migration.appliedRuleIds.length} rules were imported disabled. The original snapshot remains available for rollback.`
                    : `${selectedIds.size} candidate rule${selectedIds.size === 1 ? '' : 's'} selected. Permissions will only be requested later when you enable each rule.`}
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>
      </ScrollArea>

      {migration ? (
        <>
          <Separator />
          <footer data-material="glass-toolbar" className="flex flex-wrap justify-end gap-2 p-4 lg:px-8">
            {applied ? (
              <Button variant="destructive" disabled={busy} onClick={() => setRollbackOpen(true)}>
                <RotateCcwIcon data-icon="inline-start" />
                {busy ? 'Restoring…' : 'Restore pre-migration snapshot'}
              </Button>
            ) : null}
            {pending ? (
              <Button disabled={busy || Boolean(importPreview)} onClick={() => void handleApply()}>
                <CheckCircle2Icon data-icon="inline-start" />
                {busy ? 'Applying…' : `Apply ${selectedIds.size} selected`}
              </Button>
            ) : null}
          </footer>
        </>
      ) : null}

      <Dialog open={rollbackOpen} onOpenChange={(open) => !busy && setRollbackOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore the complete pre-migration snapshot?</DialogTitle>
            <DialogDescription>
              This restores every rule exactly as it was before migration. Rules or edits created afterward
              will be removed. Export anything you need before continuing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={busy}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" disabled={busy} onClick={() => void handleRollback()}>
              {busy ? 'Restoring…' : 'Restore snapshot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
