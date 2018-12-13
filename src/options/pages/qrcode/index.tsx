import React, { Component } from 'react'
import { Tabs, Row, Col, Input, Form } from 'antd'
import Title from '@/options/components/title'
import QrImg from '@/common/qr-img'
const TabPane = Tabs.TabPane
const TextArea = Input.TextArea

export default class QrCode extends Component {
  onTabClick (key: string) {
    console.log('tab click', key)
  }
  render () {
    return (
      <div>
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
                  placeholder="text / url / email address / phone number (Extra spaces will be removed)"
                  style={{ resize: 'none', height: 240 }}
                />
              </TabPane>
              <TabPane tab="Vcard" key="vcard">
                <Form layout="horizontal">
                  <Form.Item label="Name">
                    <Input />
                  </Form.Item>
                </Form>
              </TabPane>
              <TabPane tab="Message" key="message">
                <Form layout="horizontal">
                  <Form.Item label="To">
                    <Input />
                  </Form.Item>
                  <Form.Item label="Message">
                    <Input />
                  </Form.Item>
                </Form>
              </TabPane>
            </Tabs>
          </Col>
          <Col span={8}>
            <QrImg size={200} text="hello world" />
          </Col>
        </Row>
      </div>
    )
  }
}
