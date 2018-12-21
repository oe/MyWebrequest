import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'
import debounce from 'lodash.debounce'
import { Tabs, Row, Col } from 'antd'
import { WrappedFormUtils } from 'antd/lib/form/Form'
import Title from '@/options/components/title'
import QrImg from '@/common/qr-img'
import DataType from './data-type'
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl'
import { QR_CACHE_KEY } from '@/common/vars'
import './style.scss'

const TabPane = Tabs.TabPane

interface IState {
  content: string
}

interface IQrProps {
  intl: InjectedIntl
}

class QrCode extends Component<IQrProps, IState> {
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
  }
  // when form in tabpane mounted, try to fetch cached qr text in session storage
  onFormMounted (formUtils: WrappedFormUtils) {
    const text = sessionStorage.getItem(QR_CACHE_KEY)
    if (!text) return
    setTimeout(() => {
      formUtils.setFieldsValue({ content: text })
    }, 100)
    sessionStorage.removeItem(QR_CACHE_KEY)
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
            ref={name}
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
              style={{ height: 250 }}
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
