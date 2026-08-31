import { createContext, useContext } from 'react';

import { createTranslator, type AppLocale, type LocalePreference, type Translate } from './core';

export type I18nValue = {
  locale: AppLocale;
  preference: LocalePreference;
  setPreference: (preference: LocalePreference) => Promise<void>;
  t: Translate;
};
export const I18nContext = createContext<I18nValue>({
  locale: 'en',
  preference: 'system',
  setPreference: async () => undefined,
  t: createTranslator('en'),
});

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
