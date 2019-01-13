import React, { Component, MouseEvent } from 'react'
import qrUtils from './qrcode'
import locales from './locales'
import {
  IntlProvider,
  FormattedMessage,
  injectIntl,
  InjectedIntl
} from 'react-intl'
import './qr-img.scss'

interface IQrImgProps {
  intl: InjectedIntl
  size?: number
  text: string
  onDoubleClick?: (evt: MouseEvent<HTMLDivElement>) => void
}

interface IQrImgState {
  isDone: boolean
  url: string
}

class QrImg extends Component<IQrImgProps, IQrImgState> {
  // @ts-ignore
  static defaultProps: IQrImgProps = {
    size: 250,
    text: 'Hello world!'
  }
  constructor (props: IQrImgProps) {
    super(props)
    this.state = { isDone: true, url: 'about:blank;' }
    // tslint:disable-next-line:no-floating-promises
    this.getQrUrl(props.text, props.size!)
  }
  componentWillReceiveProps (newProps: IQrImgProps) {
    // tslint:disable-next-line:no-floating-promises
    this.getQrUrl(newProps.text, newProps.size!)
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
    const locale = this.props.intl.locale === 'zh' ? locales.zh : locales.en
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

export default injectIntl(QrImg)
