import React, { Component } from 'react'
import Title from '@/options/components/title'
/* import List from './list' */
import MForm from './form'
import { Provider, connect } from 'react-redux'
import store from './store'

export default class Requests extends Component {
  render () {
    return (
      <Provider store={store}>
        <div className="request-page">
          <Title
            title="Web Request"
            subtitle="manage all your web requests"
            tip="xxxx"
          />
          <MForm />
          {/* <List /> */}
        </div>
      </Provider>
    )
  }
}
