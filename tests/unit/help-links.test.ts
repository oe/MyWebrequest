import { describe, expect, it } from 'vitest';

import { helpUrl } from '@/ui/help-links';
import { supportedLocales } from '@/ui/i18n/core';

describe('help links', () => {
  it.each([
    ['en', 'https://app.evecalm.com/MyWebrequest/guides/quick-start/'],
    ['zh-CN', 'https://app.evecalm.com/MyWebrequest/zh-CN/guides/quick-start/'],
    ['ko', 'https://app.evecalm.com/MyWebrequest/ko/guides/quick-start/'],
    ['ja', 'https://app.evecalm.com/MyWebrequest/ja/guides/quick-start/'],
    ['fr', 'https://app.evecalm.com/MyWebrequest/fr/guides/quick-start/'],
    ['es', 'https://app.evecalm.com/MyWebrequest/es/guides/quick-start/'],
  ] as const)('uses the published route for %s', (locale, expected) => {
    expect(helpUrl(locale)).toBe(expected);
  });

  it('covers every supported extension locale', () => {
    expect(supportedLocales.map((locale) => new URL(helpUrl(locale)).pathname)).toHaveLength(6);
  });
});
