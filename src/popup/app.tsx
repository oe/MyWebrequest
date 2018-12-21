import React, { Component } from 'react'
import QrImg from '@/common/qr-img'
// import { QR_CACHE_KEY } from '@/common/vars'
import { injectIntl, InjectedIntl } from 'react-intl'
import Title from './title'
import Editor from './editor'
import './app.scss'

interface IState {
  isEdit: boolean
  content: string
  pageUrl: string
}

interface IProps {
  intl: InjectedIntl
}

class App extends Component<IProps, IState> {
  constructor (props: any) {
    super(props)
    this.state = { isEdit: false, content: 'hello world', pageUrl: '' }
    this.getCurrentTab()
    // added fade-in effects
    document.body.style.opacity = '0'
    document.body.style.transition = 'opacity ease-out .3s'
    requestAnimationFrame(() => {
      document.body.style.opacity = '1'
    })
  }
  getCurrentTab () {
    chrome.tabs.query(
      {
        active: true,
        lastFocusedWindow: true
      },
      tabs => {
        const url = tabs[0].url || ''
        this.setState({
          content: url,
          pageUrl: url
        })
      }
    )
  }
  _getTitle () {
    if (this.state.isEdit) {
      return {
        title: 'editQrTitle',
        subtitle: 'editQrSubTitle'
      }
    } else {
      if (!this.state.pageUrl || this.state.pageUrl === this.state.content) {
        return {
          title: 'curPageQrTitle',
          subtitle: 'dblSubTitle'
        }
      } else {
        return {
          title: 'newQrTitle',
          subtitle: 'dblSubTitle'
        }
      }
    }
  }
  getTitle () {
    const formatMessage = this.props.intl.formatMessage
    const title = this._getTitle()
    Object.keys(title).forEach(k => {
      // @ts-ignore
      title[k] = formatMessage({ id: title[k] })
    })
    return title
  }
  onQrDoubleClick () {
    this.setState({
      isEdit: true
    })
  }
  onTaSubmit (val: string) {
    this.setState({
      content: val,
      isEdit: false
    })
  }
  onClickQrMore () {
    // @TODO: set key to webrequest rule
  }
  render () {
    const formatMessage = this.props.intl.formatMessage
    return (
      <div className={'popup ' + (this.state.isEdit ? 'is-edit' : '')}>
        <Title {...this.getTitle()} />
        <div className="popup-content">
          {this.state.isEdit ? (
            <Editor
              initVal={this.state.content}
              onSubmit={this.onTaSubmit.bind(this)}
            />
          ) : null}
          <QrImg
            onDoubleClick={this.onQrDoubleClick.bind(this)}
            text={this.state.content}
          />
          <a
            href="/options/index.html#qrcode"
            target="_blank"
            onClick={this.onClickQrMore.bind(this)}
            className="more-link"
          >
            {formatMessage({ id: 'addRule4Qr' })}
          </a>
        </div>
      </div>
    )
  }
}

export default injectIntl(App)
