import React, { Component, MouseEvent } from 'react'
import qrUtils from './qrcode'
import './qr-img.scss'

interface IQrImgProps {
  size: number
  text: string
  onDoubleClick?: (evt: MouseEvent<HTMLDivElement>) => void
}

interface IQrImgState {
  isDone: boolean
  url: string
  errTip: string
}
export default class QrImg extends Component<IQrImgProps, IQrImgState> {
  static defaultProps: IQrImgProps = {
    size: 250,
    text: 'Hello world!'
  }
  constructor (props: IQrImgProps) {
    super(props)
    this.state = { isDone: true, url: 'about:blank;', errTip: '' }
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
        isDone: false,
        errTip:
          'Failed to genrate QRCode, maybe caused by too much content, please try to shorten them'
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
          <div className="qr-code-error-tip">{this.state.errTip}</div>
        ) : null}
      </div>
    )
  }
}
