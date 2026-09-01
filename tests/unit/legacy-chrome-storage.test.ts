import { describe, expect, it, vi } from 'vitest';

import {
  mergeLegacyChromeSources,
  readLegacyChromeSyncStorage,
} from '@/infrastructure/legacy-chrome-storage';

describe('legacy Chrome sync storage adapter', () => {
  it('reads the complete legacy sync namespace', async () => {
    const source = { version: '1.0', block: [{ url: '*://ads.example/*' }] };
    const get = vi.fn(async () => source);

    await expect(readLegacyChromeSyncStorage({ get })).resolves.toEqual(source);
    expect(get).toHaveBeenCalledWith(null);
  });

  it('uses the latest sync objects while recovering non-overlapping localStorage rules', () => {
    const merged = mergeLegacyChromeSources(
      {
        block: [{ url: '*://shared.example/*', enabled: true, valid: true }],
        custom: [{ matchUrl: 'https://sync.example/{id}', redirectUrl: 'https://target.example/{id}' }],
        onoff: { block: true },
      },
      {
        block: JSON.stringify(['*://shared.example/*', '*://local-only.example/*']),
        custom: JSON.stringify({
          'https://local.example/*': {
            matchUrl: 'https://local.example/{id}',
            redirectUrl: 'https://target.example/{id}',
          },
        }),
        onoff: JSON.stringify({ block: false, custom: true }),
      },
    );

    expect(merged.block).toEqual([
      { url: '*://shared.example/*', enabled: true, valid: true },
      '*://local-only.example/*',
    ]);
    expect(merged.custom).toHaveLength(2);
    expect(merged.onoff).toEqual({ block: true, custom: true });
    expect(merged['legacy-local-storage-conflict:onoff']).toEqual({ block: false });
  });

  it('preserves conflicting non-collection values under an explicit exportable key', () => {
    expect(mergeLegacyChromeSources({ future: { from: 'sync' } }, { future: '{"from":"local"}' })).toEqual({
      future: { from: 'sync' },
      'legacy-local-storage-conflict:future': { from: 'local' },
    });
  });
});
