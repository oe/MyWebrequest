import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import debounce from 'lodash.debounce'
import { Tabs, Row, Col } from 'antd'
import Title from '@/options/components/title'
import QrImg from '@/common/qr-img'
import DataType from './data-type'
import './style.scss'

const TabPane = Tabs.TabPane

interface IState {
  content: string
}

export default class QrCode extends Component<{}, IState> {
  state = { content: 'https://evecalm.com/' }
  onTabClick (key: string) {
    const ref = this.refs[key]
    if (!ref) return
    const dom = findDOMNode(ref) as HTMLDivElement
    const firstElement =
      dom.querySelector('input') || dom.querySelector('textarea')
    if (!firstElement) return

    setTimeout(() => {
      firstElement!.focus()
    }, 100)
  }
  onChange (val: string) {
    if (val === undefined) return
    this.updateContent(val)
    console.warn('val', val)
  }
  updateContent = debounce(function (this: QrCode, val: string) {
    this.setState({ content: val })
  }, 500)
  render () {
    return (
      <div className="qr-page">
        <Title title="QrCode" subtitle="Generate QRcode" tip="xxxx" />
        <Row>
          <Col span={16}>
            <Tabs
              tabPosition="left"
              style={{ height: 250 }}
              onTabClick={this.onTabClick.bind(this)}
            >
              <TabPane tab="Text" key="text">
                <DataType.Text ref="text" onChange={this.onChange.bind(this)} />
              </TabPane>
              <TabPane tab="Vcard" key="vcard">
                <DataType.Vcard
                  ref="vcard"
                  onChange={this.onChange.bind(this)}
                />
              </TabPane>
              <TabPane tab="Message" key="message">
                <DataType.Message
                  ref="message"
                  onChange={this.onChange.bind(this)}
                />
              </TabPane>
              <TabPane tab="Wifi" key="wifi">
                <DataType.Wifi ref="wifi" onChange={this.onChange.bind(this)} />
              </TabPane>
            </Tabs>
          </Col>
          <Col span={8} className="aside">
            <QrImg size={200} text={this.state.content} />
            <a
              href="https://www.qrcode-monkey.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get more data type QrCode...
            </a>
          </Col>
        </Row>
      </div>
    )
  }
}
