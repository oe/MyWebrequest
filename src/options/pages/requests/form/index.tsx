import React, { Component } from 'react'
import ActionForm from './action'
import MatchForm from './match'

export default class MForm extends Component {
  render () {
    return (
      <div>
        <MatchForm />
        <ActionForm />
      </div>
    )
  }
}
