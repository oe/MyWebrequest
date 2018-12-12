import React, { Component } from 'react'
import './title.scss'

interface IProps {
  title: string
  subtitle: string
}

export default class Title extends Component<IProps> {
  render () {
    return (
      <div className="popup-title">
        {this.props.title}
        <small>{this.props.subtitle}</small>
      </div>
    )
  }
}
