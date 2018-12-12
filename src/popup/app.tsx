import React, { Component } from 'react'
import QrImg from '@/common/qr-img'
import Title from './title'
import Editor from './editor'
import './app.scss'

interface IState {
  isEdit: boolean
  content: string
  pageUrl: string
}

export default class App extends Component<{}, IState> {
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
        console.log(tabs[0])
        const url = tabs[0].url || ''
        this.setState({
          content: url,
          pageUrl: url
        })
      }
    )
  }
  getTitle () {
    if (this.state.isEdit) {
      return {
        title: 'Edit QRCode content',
        subtitle: '(Don\'t type too much)'
      }
    } else {
      if (!this.state.pageUrl || this.state.pageUrl === this.state.content) {
        return {
          title: 'Current page\'s qrcode',
          subtitle: '(double click to edit)'
        }
      } else {
        return {
          title: 'You\'ve got a new QRCode',
          subtitle: '(double click to edit)'
        }
      }
    }
  }
  onQrDoubleClick () {
    this.setState({
      isEdit: true
    })
  }
  onTaSubmit (val: string) {
    console.log('val', val)
    this.setState({
      content: val,
      isEdit: false
    })
    setTimeout(() => {
      console.warn(this.state)
    }, 500)
  }
  render () {
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
            className="more-link"
          >
            Add a rule for current page...
          </a>
        </div>
      </div>
    )
  }
}
