import type { Locale } from '../content';

export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalized = path.replace(/^\//, '');
  if (!normalized) return `${base}/`;
  const suffix = /\.[^/]+$/.test(normalized) ? '' : '/';
  return `${base}/${normalized}${suffix}`;
}

export function localizedPath(locale: Locale, path = ''): string {
  const localePrefix = locale === 'en' ? '' : locale;
  return withBase([localePrefix, path].filter(Boolean).join('/'));
}

export function githubUrl(path = ''): string {
  return `https://github.com/oe/MyWebrequest${path}`;
}
