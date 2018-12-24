import React, { Component } from 'react'
import { Icon } from 'antd'

import './title.scss'

interface IPageTitleProps {
  title: string
  subtitle: string
  tip?: string
  middle?: boolean
}

export default class Title extends Component<IPageTitleProps> {
  onClickTip () {
    console.log('click tip', this.props.tip)
  }
  render () {
    return (
      <div className={'title' + (this.props.middle ? ' middle' : '')}>
        {this.props.title} <small>{this.props.subtitle}</small>
        {this.props.tip ? (
          <Icon
            type="question-circle"
            onClick={this.onClickTip.bind(this)}
            theme="twoTone"
          />
        ) : null}
      </div>
    )
  }
}
