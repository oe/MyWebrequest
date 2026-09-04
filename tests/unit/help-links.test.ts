import { describe, expect, it } from 'vitest';

import { helpUrl } from '@/ui/help-links';
import { supportedLocales } from '@/ui/i18n/core';

describe('help links', () => {
  it.each([
    ['en', 'https://request.forth.ink/guides/quick-start/'],
    ['zh-CN', 'https://request.forth.ink/zh-hans/guides/quick-start/'],
    ['ko', 'https://request.forth.ink/ko/guides/quick-start/'],
    ['ja', 'https://request.forth.ink/ja/guides/quick-start/'],
    ['fr', 'https://request.forth.ink/fr/guides/quick-start/'],
    ['es', 'https://request.forth.ink/es/guides/quick-start/'],
  ] as const)('uses the published route for %s', (locale, expected) => {
    expect(helpUrl(locale)).toBe(expected);
  });

  it('covers every supported extension locale', () => {
    expect(supportedLocales.map((locale) => new URL(helpUrl(locale)).pathname)).toHaveLength(6);
  });
});
