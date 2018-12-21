import React, { Component, KeyboardEvent } from 'react'
import { Button } from 'antd'
import { injectIntl, InjectedIntl } from 'react-intl'
import { onInputChange } from '@/common/react-utils'
import { isMac } from '@/common/utils'
import { QR_CACHE_KEY } from '@/common/vars'

import './editor.scss'

interface IProps {
  initVal: string
  onSubmit?: (val: string) => void
  intl: InjectedIntl
}

interface IState {
  val: string
}

class Editor extends Component<IProps, IState> {
  constructor (props: IProps) {
    super(props)
    this.state = { val: props.initVal }
  }
  qrSubmitShortCut = isMac ? '⌘+⏎' : 'ctrl+⏎'
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
  onClickMore () {
    sessionStorage.setItem(QR_CACHE_KEY, this.state.val)
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
            Go!({this.qrSubmitShortCut})
          </Button>
          <a
            href="/options/index.html#qrcode"
            target="_blank"
            onClick={this.onClickMore.bind(this)}
          >
            {this.props.intl.formatMessage({ id: 'moreQrLink' })}...
          </a>
        </div>
      </div>
    )
  }
}

export default injectIntl(Editor)
