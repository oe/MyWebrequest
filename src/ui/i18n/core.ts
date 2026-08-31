import { en, type MessageKey, type Messages } from './messages';
import { translations } from './translations';

export const supportedLocales = ['en', 'zh-CN', 'ko', 'ja', 'fr', 'es'] as const;
export type AppLocale = (typeof supportedLocales)[number];
export type LocalePreference = 'system' | AppLocale;
export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string;

export function normalizeLocale(locale: string): AppLocale | null {
  const normalized = locale.replace('_', '-').toLowerCase();
  if (normalized.startsWith('zh')) return 'zh-CN';
  return supportedLocales.find((candidate) => candidate.toLowerCase() === normalized) ?? null;
}

export function resolveLocale(candidates: readonly string[]): AppLocale {
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
    const base = normalizeLocale(candidate.split('-')[0] ?? '');
    if (base) return base;
  }
  return 'en';
}

export function browserLocaleCandidates(): string[] {
  const extensionLocale =
    typeof browser !== 'undefined' && browser.i18n?.getUILanguage ? browser.i18n.getUILanguage() : null;
  return [extensionLocale, ...navigator.languages, navigator.language].filter((value): value is string =>
    Boolean(value),
  );
}

function interpolate(message: string, params?: Record<string, string | number>): string {
  if (!params) return message;
  return message.replace(/\{([A-Za-z0-9_]+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
}

export function createTranslator(locale: AppLocale): Translate {
  const messages: Messages = locale === 'en' ? en : translations[locale];
  return (key, params) => interpolate(messages[key] ?? en[key], params);
}
