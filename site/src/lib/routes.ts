import type { Locale } from '../content';

const localePathSegments: Record<Locale, string> = {
  en: '',
  'zh-CN': 'zh-hans',
  ko: 'ko',
  ja: 'ja',
  fr: 'fr',
  es: 'es',
};

const localeLanguageTags: Record<Locale, string> = {
  en: 'en',
  'zh-CN': 'zh-Hans',
  ko: 'ko',
  ja: 'ja',
  fr: 'fr',
  es: 'es',
};

export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalized = path.replace(/^\//, '');
  if (!normalized) return `${base}/`;
  const suffix = /\.[^/]+$/.test(normalized) ? '' : '/';
  return `${base}/${normalized}${suffix}`;
}

export function localizedPath(locale: Locale, path = ''): string {
  const localePrefix = localePathSegment(locale);
  return withBase([localePrefix, path].filter(Boolean).join('/'));
}

export function localePathSegment(locale: Locale): string {
  return localePathSegments[locale];
}

export function localeLanguageTag(locale: Locale): string {
  return localeLanguageTags[locale];
}

export function githubUrl(path = ''): string {
  return `https://github.com/oe/MyWebrequest${path}`;
}
