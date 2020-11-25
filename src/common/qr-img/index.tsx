import React, { PureComponent, MouseEvent } from 'react'
import qrUtils from './qrcode'
import locales from './locales'
import {
  IntlProvider,
  FormattedMessage,
} from 'react-intl'
import './qr-img.scss'

interface IQrImgProps {
  // intl: InjectedIntl
  size?: number
  text: string
  onDoubleClick?: (evt: MouseEvent<HTMLDivElement>) => void
}

interface IQrImgState {
  isDone: boolean
  url: string
}

export default class QrImg extends PureComponent<IQrImgProps, IQrImgState> {
  // @ts-ignore
  static defaultProps: IQrImgProps = {
    size: 250,
    text: 'Hello world!'
  }
  constructor (props: IQrImgProps) {
    super(props)
    this.state = { isDone: true, url: 'about:blank;' }
  }
  componentDidMount() {
    this.getQrUrl()
  }
  componentDidUpdate () {
    this.getQrUrl()
  }
  async getQrUrl () {
    try {
      const url = await qrUtils.makeQRCode(this.props.text, this.props.size)
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
    // const locale = this.props.intl.locale === 'zh' ? locales.zh : locales.en
    const locale = 'zh'
    const messages = locales[locale]
    return (
      <IntlProvider locale={locale} messages={messages}>
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
