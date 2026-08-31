import { describe, expect, it } from 'vitest';

import { createTranslator, resolveLocale, supportedLocales } from '@/ui/i18n/core';

describe('UI localization', () => {
  it('supports every required locale and resolves regional variants deterministically', () => {
    expect(supportedLocales).toEqual(['en', 'zh-CN', 'ko', 'ja', 'fr', 'es']);
    expect(resolveLocale(['zh-TW', 'en-US'])).toBe('zh-CN');
    expect(resolveLocale(['ko-KR'])).toBe('ko');
    expect(resolveLocale(['ja-JP'])).toBe('ja');
    expect(resolveLocale(['fr-CA'])).toBe('fr');
    expect(resolveLocale(['es-MX'])).toBe('es');
    expect(resolveLocale(['de-DE'])).toBe('en');
  });

  it('interpolates values without interpreting HTML', () => {
    const translate = createTranslator('zh-CN');
    expect(translate('enableRule', { name: '<img src=x onerror=alert(1)>' })).toBe(
      '启用 <img src=x onerror=alert(1)>',
    );
  });
});
