import { afterEach, describe, expect, it, vi } from 'vitest';

import { detectAndStageLegacyMigration } from '@/application/migration-detection';
import { MIGRATION_STORAGE_KEY } from '@/infrastructure/migration-store';

function storageMock(values: Record<string, string>): Storage {
  const keys = Object.keys(values);
  return {
    length: keys.length,
    clear: () => undefined,
    getItem: (key) => values[key] ?? null,
    key: (index) => keys[index] ?? null,
    removeItem: () => undefined,
    setItem: () => undefined,
  };
}

describe('legacy migration detection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stages legacy localStorage without changing active rules', async () => {
    const set = vi.fn<(value: Record<string, unknown>) => Promise<void>>().mockResolvedValue(undefined);
    vi.stubGlobal('browser', {
      storage: { local: { get: vi.fn(async () => ({})), set } },
    });

    const result = await detectAndStageLegacyMigration(
      storageMock({ block: '["*://ads.example/*"]', onoff: '{"block":true}' }),
      '2026-08-31T02:00:00.000Z',
    );

    expect(result.kind).toBe('staged');
    expect(set).toHaveBeenCalledTimes(1);
    expect(set.mock.calls[0]?.[0]).toHaveProperty(MIGRATION_STORAGE_KEY);
    expect(set.mock.calls[0]?.[0]).not.toHaveProperty('requestRulesState');
  });

  it('does nothing when neither a staged migration nor legacy data exists', async () => {
    const set = vi.fn<(value: Record<string, unknown>) => Promise<void>>().mockResolvedValue(undefined);
    vi.stubGlobal('browser', {
      storage: { local: { get: vi.fn(async () => ({})), set } },
    });

    await expect(detectAndStageLegacyMigration(storageMock({}), '2026-08-31T02:00:00.000Z')).resolves.toEqual(
      { kind: 'none' },
    );
    expect(set).not.toHaveBeenCalled();
  });

  it('stages the last public Chrome sync schema before legacy page storage', async () => {
    const set = vi.fn<(value: Record<string, unknown>) => Promise<void>>().mockResolvedValue(undefined);
    vi.stubGlobal('browser', {
      storage: {
        local: { get: vi.fn(async () => ({})), set },
        sync: {
          get: vi.fn(async () => ({
            version: '1.0',
            block: [{ url: '*://sync.example/*', valid: true, enabled: true }],
            onoff: { block: true },
          })),
        },
      },
    });

    const result = await detectAndStageLegacyMigration(
      storageMock({ block: '["*://local-only.example/*"]' }),
      '2026-08-31T02:00:00.000Z',
    );

    expect(result.kind).toBe('staged');
    if (result.kind !== 'staged') return;
    expect(result.migration.bundle.report.source).toBe('legacy-chrome-storage');
    expect(result.migration.bundle.report.items.map((item) => item.sourceLocator)).toEqual(
      expect.arrayContaining(['block[0]', 'block[1]', 'onoff.block', 'version']),
    );
    expect(result.migration.bundle.report.items).toHaveLength(4);
  });

  it('does not overwrite a staged migration when legacy source changes', async () => {
    const set = vi.fn<(value: Record<string, unknown>) => Promise<void>>().mockResolvedValue(undefined);
    vi.stubGlobal('browser', {
      storage: { local: { get: vi.fn(async () => ({})), set } },
    });
    const first = await detectAndStageLegacyMigration(
      storageMock({ block: '["*://a.example/*"]' }),
      '2026-08-31T02:00:00.000Z',
    );
    expect(first.kind).toBe('staged');
    if (first.kind !== 'staged') return;
    set.mockClear();
    vi.stubGlobal('browser', {
      storage: {
        local: {
          get: vi.fn(async () => ({ [MIGRATION_STORAGE_KEY]: first.migration })),
          set,
        },
      },
    });

    const changed = await detectAndStageLegacyMigration(
      storageMock({ block: '["*://b.example/*"]' }),
      '2026-08-31T02:05:00.000Z',
    );

    expect(changed).toMatchObject({ kind: 'source-changed', migration: first.migration });
    expect(set).not.toHaveBeenCalled();
  });
});
