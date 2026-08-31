import { useEffect, useMemo, type ReactNode } from 'react';

import { browserLocaleCandidates, createTranslator, resolveLocale } from './core';
import { I18nContext } from './context';

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useMemo(() => resolveLocale(browserLocaleCandidates()), []);
  const value = useMemo(() => ({ locale, t: createTranslator(locale) }), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
