import React, { Component } from 'react'
import { Row, Col } from 'antd'
import { Route, Redirect } from 'react-router-dom'
import Navi from './navi'
import Routes from './routes'
import './app.scss'

export default class App extends Component {
  render () {
    return (
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
    )
  }
}
