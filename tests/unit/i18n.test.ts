import { describe, expect, it } from 'vitest';

import { createTranslator, resolveLocale, supportedLocales } from '@/ui/i18n/core';
import { en } from '@/ui/i18n/messages';
import { translations } from '@/ui/i18n/translations';

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

  it('ships a complete dictionary with matching placeholders for every locale', () => {
    const englishKeys = Object.keys(en).sort();
    const placeholders = (message: string) =>
      [...message.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort();

    for (const messages of Object.values(translations)) {
      expect(Object.keys(messages).sort()).toEqual(englishKeys);
      for (const key of englishKeys) {
        const typedKey = key as keyof typeof en;
        expect(placeholders(messages[typedKey])).toEqual(placeholders(en[typedKey]));
        expect(messages[typedKey].trim()).not.toBe('');
      }
    }
  });
});
