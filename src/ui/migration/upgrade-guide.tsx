import type { StoredMigration } from '@/application/migration-apply';
import { downloadJson } from '@/ui/lib/download-json';
import { useEffect, useState } from 'react';
import { supportsLegacyMigration } from '@/infrastructure/browser-capabilities';
import { readLegacyChromeSyncStorage } from '@/infrastructure/legacy-chrome-storage';
import { loadStoredMigration } from '@/infrastructure/migration-store';
import { Button } from '@/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/dialog';
import { useI18n } from '@/ui/i18n';
import { upgradeCopy } from './upgrade-guide-copy';

const SEEN_KEY = 'requestOrbitUpgradeGuideV1Seen';

export function UpgradeDialog({
  open,
  onClose,
  onReview,
}: {
  open: boolean;
  onClose: () => void;
  onReview: () => void;
}) {
  const { locale, t } = useI18n();
  const copy = upgradeCopy[locale];
  const [migration, setMigration] = useState<StoredMigration | null>(null);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const refresh = () => {
      void loadStoredMigration()
        .then((value) => {
          if (!cancelled) setMigration(value);
        })
        .catch(() => {});
    };
    refresh();
    if (typeof browser !== 'undefined') browser.storage?.onChanged.addListener(refresh);
    return () => {
      cancelled = true;
      if (typeof browser !== 'undefined') browser.storage?.onChanged.removeListener(refresh);
    };
  }, [open]);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const finish = async (review: boolean) => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      if (typeof browser !== 'undefined' && browser.storage?.local) {
        await browser.storage.local.set({ [SEEN_KEY]: true });
      }
      onClose();
      if (review) onReview();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) void finish(false);
      }}
    >
      <DialogContent
        className="flex max-h-[90dvh] flex-col sm:max-w-xl"
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.changes}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto text-sm">
          <p>{copy.builder}</p>
          <p>{copy.rules}</p>
          <p>{copy.removed}</p>
          {error ? <p role="alert">{copy.error}</p> : null}
        </div>
        <DialogFooter className="shrink-0 flex-wrap">
          {migration ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                downloadJson(
                  { exportVersion: 1, kind: 'my-webrequest-legacy-migration', ...migration.bundle },
                  `request-orbit-migration-${migration.bundle.report.sourceFingerprint.slice(0, 12)}.json`,
                )
              }
            >
              {t('exportReport')}
            </Button>
          ) : null}
          <Button variant="outline" disabled={busy} onClick={() => void finish(false)}>
            {copy.later}
          </Button>
          <Button disabled={busy} onClick={() => void finish(true)}>
            {copy.review}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Reading legacy data here never stages a migration or changes active rules.
export function UpgradeNotice({
  popup = false,
  legacyDetected = false,
  onReview,
}: {
  popup?: boolean;
  legacyDetected?: boolean;
  onReview: () => void;
}) {
  const { locale } = useI18n();
  const copy = upgradeCopy[locale];
  const [open, setOpen] = useState(false);
  const [attention, setAttention] = useState(false);
  useEffect(() => {
    if (!supportsLegacyMigration() || typeof browser === 'undefined' || !browser.storage?.local) return;
    let cancelled = false;
    let revision = 0;
    const refresh = async () => {
      const current = ++revision;
      try {
        const [stored, source, migration] = await Promise.all([
          browser.storage.local.get([SEEN_KEY, 'requestOrbitLegacyUpgrade']),
          readLegacyChromeSyncStorage(),
          loadStoredMigration(),
        ]);
        if (cancelled || current !== revision) return;
        const legacy = legacyDetected || Object.keys(source).length > 0 || Boolean(migration);
        const unseen = !stored[SEEN_KEY] && (legacy || stored.requestOrbitLegacyUpgrade === true);
        const pending = legacy && migration?.status !== 'applied';
        setAttention(Boolean(unseen || pending));
        if (!popup) setOpen(Boolean(unseen));
      } catch {
        // Detection is retried on the next storage change/open. The manual guide remains available.
      }
    };
    void refresh();
    const changed = () => {
      void refresh();
    };
    browser.storage.onChanged.addListener(changed);
    return () => {
      cancelled = true;
      browser.storage.onChanged.removeListener(changed);
    };
  }, [legacyDetected, popup]);
  if (!supportsLegacyMigration()) return null;
  return (
    <>
      {attention ? (
        <Button
          variant="outline"
          className={popup ? 'h-auto text-left whitespace-normal' : ''}
          onClick={() => (popup ? onReview() : setOpen(true))}
        >
          {popup ? `${copy.title} · ${copy.pendingHelp}` : copy.pending}
        </Button>
      ) : null}
      {!popup ? <UpgradeDialog open={open} onClose={() => setOpen(false)} onReview={onReview} /> : null}
    </>
  );
}
