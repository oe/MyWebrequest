import { createContext, useContext } from 'react';

import { createTranslator, type AppLocale, type Translate } from './core';

export type I18nValue = { locale: AppLocale; t: Translate };
export const I18nContext = createContext<I18nValue>({ locale: 'en', t: createTranslator('en') });

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}
