import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  loadLocalePreference,
  saveLocalePreference,
  subscribeToLocalePreference,
} from '@/infrastructure/ui-preferences';
import { browserLocaleCandidates, createTranslator, resolveLocale, type LocalePreference } from './core';
import { I18nContext } from './context';

export function I18nProvider({ children }: { children: ReactNode }) {
  const systemLocale = useMemo(() => resolveLocale(browserLocaleCandidates()), []);
  const [preference, setPreferenceState] = useState<LocalePreference>('system');
  const locale = preference === 'system' ? systemLocale : preference;
  const setPreference = useCallback(async (next: LocalePreference) => {
    await saveLocalePreference(next);
    setPreferenceState(next);
  }, []);
  const value = useMemo(
    () => ({ locale, preference, setPreference, t: createTranslator(locale) }),
    [locale, preference, setPreference],
  );

  useEffect(() => {
    let cancelled = false;
    void loadLocalePreference().then((stored) => {
      if (!cancelled) setPreferenceState(stored);
    });
    const unsubscribe = subscribeToLocalePreference(setPreferenceState);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = value.t('appName');
  }, [locale, value]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
