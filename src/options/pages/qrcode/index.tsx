import React, { Component } from 'react'
import debounce from 'lodash.debounce'
import { Tabs, Row, Col, Input } from 'antd'
import Title from '@/options/components/title'
import QrImg from '@/common/qr-img'
import DataType from './data-type'
import './style.scss'

const TabPane = Tabs.TabPane
const TextArea = Input.TextArea

interface IState {
  content: string
}

export default class QrCode extends Component<{}, IState> {
  state = { content: 'https://evecalm.com/' }
  onTabClick (key: string) {
    console.log('tab click', key)
  }
  onChange (val: string) {
    this.updateContent(val)
  }
  updateContent = debounce(function (this: QrCode, val: string) {
    this.setState({ content: val })
  }, 100)
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
                <TextArea
                  autoFocus
                  onChange={evt => this.onChange(evt.target.value)}
                  placeholder="text / url / email address / phone number (Extra spaces will be removed)"
                  style={{ resize: 'none', height: 240 }}
                />
              </TabPane>
              <TabPane tab="Vcard" key="vcard">
                <DataType.Vcard onChange={this.onChange.bind(this)} />
              </TabPane>
              <TabPane tab="Message" key="message">
                <DataType.Message onChange={this.onChange.bind(this)} />
              </TabPane>
              <TabPane tab="Wifi" key="wifi">
                <DataType.Wifi onChange={this.onChange.bind(this)} />
              </TabPane>
            </Tabs>
          </Col>
          <Col span={8} style={{ textAlign: 'center' }}>
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
