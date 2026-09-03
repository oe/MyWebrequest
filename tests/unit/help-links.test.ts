import { describe, expect, it } from 'vitest';

import { helpUrl } from '@/ui/help-links';
import { supportedLocales } from '@/ui/i18n/core';

describe('help links', () => {
  it.each([
    ['en', 'https://webrequest.forth.ink/guides/quick-start/'],
    ['zh-CN', 'https://webrequest.forth.ink/zh-hans/guides/quick-start/'],
    ['ko', 'https://webrequest.forth.ink/ko/guides/quick-start/'],
    ['ja', 'https://webrequest.forth.ink/ja/guides/quick-start/'],
    ['fr', 'https://webrequest.forth.ink/fr/guides/quick-start/'],
    ['es', 'https://webrequest.forth.ink/es/guides/quick-start/'],
  ] as const)('uses the published route for %s', (locale, expected) => {
    expect(helpUrl(locale)).toBe(expected);
  });

  it('covers every supported extension locale', () => {
    expect(supportedLocales.map((locale) => new URL(helpUrl(locale)).pathname)).toHaveLength(6);
  });
});
