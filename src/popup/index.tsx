import React from 'react'
import ReactDOM from 'react-dom'
import { IntlProvider } from 'react-intl'
import App from './app'
import i18n from '@/common/i18n'
import zhLocal from './locales/zh'
import enLocal from './locales/en'

const locale = i18n.lang === 'zh' ? zhLocal : enLocal

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
