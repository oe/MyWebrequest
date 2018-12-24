import React, { Component } from 'react'
import Title from '@/options/components/title'
import List from './list'
import MForm from './form'

export default class Requests extends Component {
  render () {
    return (
      <div className="request-page">
        <Title
          title="Web Request"
          subtitle="manage all your web requests"
          tip="xxxx"
        />
        <MForm />
        {/* <List /> */}
      </div>
    )
  }
}
