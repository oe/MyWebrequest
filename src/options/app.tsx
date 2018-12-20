import React, { Component } from 'react'
import { Row, Col } from 'antd'
import { Route, Redirect } from 'react-router-dom'
import { IntlProvider, addLocaleData } from 'react-intl'
import i18n from '@/common/i18n'
import Navi from './navi'
import Routes from './routes'
import zhLocal from './locales/zh'
import enLocal from './locales/en'
import zh from 'react-intl/locale-data/zh'
import en from 'react-intl/locale-data/en'
import './app.scss'

const locale = i18n.lang === 'zh' ? zhLocal : enLocal

addLocaleData([...zh, ...en])

export default class App extends Component {
  render () {
    return (
      <IntlProvider locale={i18n.lang} messages={locale}>
        <div className="app">
          <Row>
            <Col span={4}>
              <Navi />
            </Col>
            <Col span={20}>
              <Route
                exact
                strict
                path="/"
                render={() => <Redirect exact strict to="/requests" />}
              />
              <Routes />
            </Col>
          </Row>
        </div>
      </IntlProvider>
    )
  }
}
