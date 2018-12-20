import React from 'react'
import ReactDOM from 'react-dom'
import { IntlProvider, addLocaleData } from 'react-intl'
import App from './app'
import i18n from '@/common/i18n'
import zhLocal from './locales/zh'
import enLocal from './locales/en'
import zh from 'react-intl/locale-data/zh'
import en from 'react-intl/locale-data/en'

const locale = i18n.lang === 'zh' ? zhLocal : enLocal

addLocaleData([...zh, ...en])

ReactDOM.render(
  <IntlProvider
    messages={locale}
    locale={i18n.lang}
    defaultLocale={i18n.defaultLang}
  >
    <App />
  </IntlProvider>,
  document.getElementById('app')
)
