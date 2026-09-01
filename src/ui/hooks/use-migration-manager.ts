import { useCallback, useEffect, useState } from 'react';

import {
  applyMigration,
  createPendingMigration,
  rollbackMigration,
  type StoredMigration,
} from '@/application/migration-apply';
import {
  detectAndStageLegacyMigration,
  type LegacyMigrationDetection,
} from '@/application/migration-detection';
import { createMigrationBundle } from '@/application/migration-service';
import type { StoredState } from '@/domain/rules/model';
import { commitStateAndMigration, saveStoredMigration } from '@/infrastructure/migration-store';
import { reconcileDynamicRules } from '@/infrastructure/rule-runtime';
import { useI18n } from '@/ui/i18n';

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function useMigrationManager(enabled = true) {
  const { t } = useI18n();
  const [migration, setMigration] = useState<StoredMigration | null>(null);
  const [importPreview, setImportPreview] = useState<StoredMigration | null>(null);
  const [detection, setDetection] = useState<LegacyMigrationDetection['kind']>('none');
  const [detectedFingerprint, setDetectedFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void detectAndStageLegacyMigration()
      .then((result) => {
        if (cancelled) return;
        setDetection(result.kind);
        if ('migration' in result) setMigration(result.migration);
        if (result.kind === 'source-changed') setDetectedFingerprint(result.detectedFingerprint);
      })
      .catch(() => {
        if (!cancelled) setError(t('legacyDetectionError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, t]);

  const previewLegacyImport = useCallback(
    async (text: string) => {
      if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) {
        throw new Error(t('legacyTooLarge'));
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error(t('legacyInvalidJson'));
      }
      if (!isRecord(parsed)) throw new Error(t('legacyObjectRequired'));
      const now = new Date().toISOString();
      const bundle = await createMigrationBundle(parsed, 'legacy-json-import', now);
      const pending = createPendingMigration(bundle, now);
      setImportPreview(pending);
      return pending;
    },
    [t],
  );

  const confirmImportPreview = useCallback(async () => {
    if (!importPreview || busy) return;
    setBusy(true);
    setError(null);
    try {
      await saveStoredMigration(importPreview);
      setMigration(importPreview);
      setDetection('staged');
      setDetectedFingerprint(null);
      setImportPreview(null);
    } catch (caught) {
      const message = t('reportStageError');
      setError(message);
      throw new Error(message, { cause: caught });
    } finally {
      setBusy(false);
    }
  }, [busy, importPreview, t]);

  const applySelected = useCallback(
    async (state: StoredState, selectedItemIds: readonly string[]) => {
      if (!migration || busy) return null;
      setBusy(true);
      setError(null);
      try {
        const result = await applyMigration(
          state,
          migration,
          selectedItemIds,
          { reconcile: reconcileDynamicRules, commit: commitStateAndMigration },
          new Date().toISOString(),
        );
        setMigration(result.migration);
        return result.state;
      } catch (caught) {
        const message = t('migrationApplyError');
        setError(message);
        throw new Error(message, { cause: caught });
      } finally {
        setBusy(false);
      }
    },
    [busy, migration, t],
  );

  const rollback = useCallback(
    async (state: StoredState) => {
      if (!migration || busy) return null;
      setBusy(true);
      setError(null);
      try {
        const result = await rollbackMigration(
          state,
          migration,
          { reconcile: reconcileDynamicRules, commit: commitStateAndMigration },
          new Date().toISOString(),
        );
        setMigration(result.migration);
        return result.state;
      } catch (caught) {
        const message = t('rollbackError');
        setError(message);
        throw new Error(message, { cause: caught });
      } finally {
        setBusy(false);
      }
    },
    [busy, migration, t],
  );

  return {
    applySelected,
    busy,
    cancelImportPreview: () => setImportPreview(null),
    confirmImportPreview,
    detectedFingerprint,
    detection,
    error,
    importPreview,
    loading,
    migration,
    previewLegacyImport,
    rollback,
  };
}
