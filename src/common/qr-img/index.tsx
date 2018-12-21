import React, { Component, MouseEvent } from 'react'
import i18n from '@/common/i18n'
import qrUtils from './qrcode'
import locales from './locales'
import { IntlProvider, FormattedMessage } from 'react-intl'
import './qr-img.scss'

const locale = i18n.lang === 'zh' ? locales.zh : locales.en

interface IQrImgProps {
  size: number
  text: string
  onDoubleClick?: (evt: MouseEvent<HTMLDivElement>) => void
}

interface IQrImgState {
  isDone: boolean
  url: string
}
export default class QrImg extends Component<IQrImgProps, IQrImgState> {
  static defaultProps: IQrImgProps = {
    size: 250,
    text: 'Hello world!'
  }
  constructor (props: IQrImgProps) {
    super(props)
    this.state = { isDone: true, url: 'about:blank;' }
    this.getQrUrl(props.text, props.size)
  }
  componentWillReceiveProps (newProps: IQrImgProps) {
    this.getQrUrl(newProps.text, newProps.size)
  }
  async getQrUrl (text: string, size: number) {
    try {
      const url = await qrUtils.makeQRCode(text, size)
      this.setState({ isDone: true, url })
    } catch (error) {
      console.error(error)
      this.setState({
        isDone: false
      })
    }
  }
  onDoubleClick (evt: MouseEvent<HTMLDivElement>) {
    if (this.props.onDoubleClick) {
      this.props.onDoubleClick(evt)
    }
  }
  render () {
    return (
      <IntlProvider messages={locale}>
        <div
          onDoubleClick={this.onDoubleClick.bind(this)}
          className="qr-code"
          style={{
            width: this.props.size + 'px',
            height: this.props.size + 'px'
          }}
        >
          <img src={this.state.url} />
          {!this.state.isDone ? (
            <div className="qr-code-error-tip">
              <FormattedMessage
                id={this.props.text ? 'errTip' : 'noTextErrTip'}
              />
            </div>
          ) : null}
        </div>
      </IntlProvider>
    )
  }
}
