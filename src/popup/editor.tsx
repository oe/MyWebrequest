import React, { Component, KeyboardEvent } from 'react'
import { Button } from 'antd'
import { onInputChange } from '@/common/react-utils'

import './editor.scss'

interface IProps {
  initVal: string
  onSubmit?: (val: string) => void
}

interface IState {
  val: string
}

export default class Editor extends Component<IProps, IState> {
  constructor (props: IProps) {
    super(props)
    this.state = { val: props.initVal }
  }
  ta!: HTMLTextAreaElement
  componentDidMount () {
    setTimeout(() => {
      this.ta.select()
      this.ta.focus()
    }, 10)
  }
  componentWillReceiveProps (newProps: IProps) {
    this.setState({
      val: newProps.initVal
    })
  }
  onSubmit () {
    if (this.props.onSubmit) {
      this.props.onSubmit(this.state.val)
    }
  }
  onKeyDown (evt: KeyboardEvent<HTMLTextAreaElement>) {
    if (evt.keyCode === 13 && (evt.metaKey || evt.ctrlKey)) {
      evt.preventDefault()
      this.onSubmit()
    }
  }
  render () {
    return (
      <div className="text-container">
        <textarea
          ref={ta => (this.ta = ta!)}
          value={this.state.val}
          onKeyDown={this.onKeyDown.bind(this)}
          onChange={onInputChange.bind(this, 'val')}
        />
        <div className="action-btn">
          <Button size="small" onClick={this.onSubmit.bind(this)}>
            Submit(⌘+⏎)
          </Button>
          <a href="/options/index.html#qrcode" target="_blank">
            more...
          </a>
        </div>
      </div>
    )
  }
}
