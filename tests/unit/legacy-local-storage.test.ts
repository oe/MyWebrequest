import { describe, expect, it } from 'vitest';

import { readLegacyLocalStorage } from '@/infrastructure/legacy-local-storage';

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

describe('legacy local storage adapter', () => {
  it('reads known and unknown legacy keys without including current preview state', () => {
    const result = readLegacyLocalStorage(
      storageMock({
        block: '["*://ads.example/*"]',
        customFutureSetting: '{"enabled":true}',
        'request-rules-preview-state': '{"schemaVersion":1}',
      }),
    );

    expect(result).toEqual({
      block: '["*://ads.example/*"]',
      customFutureSetting: '{"enabled":true}',
    });
  });
});
