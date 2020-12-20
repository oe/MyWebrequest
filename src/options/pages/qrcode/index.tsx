import React, { Component, ReactInstance } from 'react'
import { findDOMNode } from 'react-dom'
import debounce from 'lodash.debounce'
import { Tabs, Row, Col } from 'antd'
import { FormInstance } from 'rc-field-form'
import Title from '@/options/components/title'
import QrImg from '@/common/qr-img'
import DataType from './data-type'
import { injectIntl, FormattedMessage, WrappedComponentProps } from 'react-intl'
import { QR_CACHE_KEY } from '@/common/vars'
import './style.scss'

const TabPane = Tabs.TabPane

interface IState {
  content: string
}

class QrCode extends Component<WrappedComponentProps, IState> {
  state = { content: 'https://evecalm.com/' }
  refCache: { [k: string]: ReactInstance } = {}
  onTabClick (key: string) {
    const ref = this.refCache[key]
    if (!ref) return
    // eslint-disable-next-line react/no-find-dom-node
    const dom = findDOMNode(ref) as HTMLDivElement
    const firstElement =
      dom.querySelector('input') || dom.querySelector('textarea')
    if (!firstElement) return

    setTimeout(() => {
      firstElement.focus()
    }, 100)
  }
  onChange (val?: string) {
    if (val === undefined) return
    this.updateContent(val)
  }
  // when form in tabpane mounted, try to fetch cached qr text in session storage
  onFormMounted (form: FormInstance) {
    const text = sessionStorage.getItem(QR_CACHE_KEY)
    if (!text) return
    setTimeout(() => {
      form.setFieldsValue({ content: text })
    }, 100)
    sessionStorage.removeItem(QR_CACHE_KEY)
  }
  updateRef = (name: string, node: ReactInstance) => {
    this.refCache[name] = node
  }
  generateTabs () {
    return Object.keys(DataType).map(k => {
      // @ts-ignore
      const TabPaneContent = DataType[k]
      const name = k.toLowerCase()
      return (
        <TabPane
          key={name}
          tab={this.props.intl.formatMessage({ id: `qrcode.types.${name}` })}
        >
          <TabPaneContent
            ref={(ref: ReactInstance) => this.updateRef(name, ref)}
            onChange={this.onChange.bind(this)}
            onMounted={this.onFormMounted.bind(this)}
          />
        </TabPane>
      )
    })
  }
  updateContent = debounce(function (this: QrCode, val: string) {
    this.setState({ content: val })
  }, 500)
  render () {
    const formatMessage = this.props.intl.formatMessage
    return (
      <div className="qr-page">
        <Title
          title={formatMessage({ id: 'qrcode.title' })}
          subtitle={formatMessage({ id: 'qrcode.subtitle' })}
        />
        <Row>
          <Col span={16}>
            <Tabs
              tabPosition="left"
              onTabClick={this.onTabClick.bind(this)}
            >
              {this.generateTabs()}
            </Tabs>
          </Col>
          <Col span={8} className="aside">
            <QrImg size={200} text={this.state.content} />
            <a
              href="https://www.qrcode-monkey.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FormattedMessage id="qrcode.moreQr" />
            </a>
          </Col>
        </Row>
      </div>
    )
  }
}

export default injectIntl(QrCode)
