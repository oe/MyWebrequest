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
      this.setState({ isDone: false, url: 'about:blank;' })
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
        {this.state.isDone ? (
          <img src={this.state.url} />
        ) : (
          'failed to load qrcode'
        )}
      </div>
    )
  }
}
