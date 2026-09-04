import type { AppLocale } from '@/ui/i18n';

export const HELP_SITE = 'https://request.forth.ink';

const localeSegments: Record<AppLocale, string> = {
  en: '',
  'zh-CN': '/zh-hans',
  ko: '/ko',
  ja: '/ja',
  fr: '/fr',
  es: '/es',
};

export function helpUrl(locale: AppLocale, guide = 'quick-start'): string {
  return `${HELP_SITE}${localeSegments[locale]}/guides/${guide}/`;
}
