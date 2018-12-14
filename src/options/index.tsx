import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter as Router } from 'react-router-dom'
import App from './app'
import i18n from '@/common/i18n'

i18n.i18nHTML()

ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById('app')
)
