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

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function useMigrationManager() {
  const [migration, setMigration] = useState<StoredMigration | null>(null);
  const [importPreview, setImportPreview] = useState<StoredMigration | null>(null);
  const [detection, setDetection] = useState<LegacyMigrationDetection['kind']>('none');
  const [detectedFingerprint, setDetectedFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void detectAndStageLegacyMigration()
      .then((result) => {
        if (cancelled) return;
        setDetection(result.kind);
        if ('migration' in result) setMigration(result.migration);
        if (result.kind === 'source-changed') setDetectedFingerprint(result.detectedFingerprint);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Legacy detection failed.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const previewLegacyImport = useCallback(async (text: string) => {
    if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) {
      throw new Error('Legacy imports must be 5 MB or smaller.');
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('The selected file is not valid JSON.');
    }
    if (!isRecord(parsed)) throw new Error('A legacy import must contain a JSON object.');
    const now = new Date().toISOString();
    const bundle = await createMigrationBundle(parsed, 'legacy-json-import', now);
    const pending = createPendingMigration(bundle, now);
    setImportPreview(pending);
    return pending;
  }, []);

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
      setError(caught instanceof Error ? caught.message : 'The import preview could not be staged.');
      throw caught;
    } finally {
      setBusy(false);
    }
  }, [busy, importPreview]);

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
        setError(caught instanceof Error ? caught.message : 'The migration could not be applied.');
        throw caught;
      } finally {
        setBusy(false);
      }
    },
    [busy, migration],
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
        setError(caught instanceof Error ? caught.message : 'The migration could not be rolled back.');
        throw caught;
      } finally {
        setBusy(false);
      }
    },
    [busy, migration],
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
