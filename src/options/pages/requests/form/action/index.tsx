import React, { Component, Fragment } from 'react'
import { Form, Select, Input, Button, Row, Col } from 'antd'
import { WrappedFormUtils } from 'antd/lib/form/Form'
import { IFromUtisProps, formItemLayout } from '../common'
import { EWebRuleType } from '@/types/requests'

import HeaderItems from './header'
import InjectItems from './inject'

const FormItem = Form.Item
const Option = Select.Option

function RedirectItems (props: IFromUtisProps) {
  const getFieldDecorator = props.formUtils.getFieldDecorator
  return (
    <Fragment>
      <FormItem label="Redirect to">
        {getFieldDecorator('redirectUrl')(<Input />)}
      </FormItem>
    </Fragment>
  )
}

function UaItems (props: IFromUtisProps) {
  const getFieldDecorator = props.formUtils.getFieldDecorator
  return (
    <Fragment>
      <FormItem label="Change Ua to">
        {getFieldDecorator('ua')(<Input />)}
      </FormItem>
    </Fragment>
  )
}

interface IState {
  ruleType: EWebRuleType
}

export default class ActionForm extends Component<IFromUtisProps, IState> {
  state = {
    ruleType: EWebRuleType.REDIRECT
  }
  onRuleTypeChange = (v: EWebRuleType) => {
    this.setState({
      ruleType: v
    })
  }
  render () {
    const formUtils = this.props.formUtils
    const getFieldDecorator = formUtils.getFieldDecorator
    return (
      <Fragment>
        <FormItem label="What to do" {...formItemLayout}>
          {getFieldDecorator('cmd')(
            <Select
              onChange={this.onRuleTypeChange}
              showSearch
              placeholder="what you want to do with this url"
            >
              <Option value="REDIRECT">
                <b>Redirect</b> to a related url
              </Option>
              <Option value="BLOCK">
                <b>Block</b> the request match the url
              </Option>
              <Option value="HSTS">
                <b>HSTS</b> Force https connection
              </Option>
              <Option value="HEADER">
                <b>Alter Header</b> Change http request header sent to the
                matched url(add/update/delete http header)
              </Option>
              <Option value="REFERRER">
                <b>Remove referrer</b> to the matched url (this could enable
                hotlinking)
              </Option>
              <Option value="REFERRER_OUT">
                <b>Remove referrer</b> from the matched webpage (this could
                protect your privacy)
              </Option>
              <Option value="UA">
                <b>Change http request UA</b> to the matched url
              </Option>
              <Option value="UA_OUT">
                <b>Change http request UA</b> from the matched webpage
              </Option>
              <Option value="CORS">
                <b>Allow CORS origin request</b> to the matched url
              </Option>
              <Option value="CORS_OUT">
                <b>Allow cross origin request</b> from the matched webpage
              </Option>
              <Option value="LOG">
                <b>LOG</b> requests to the matched url
              </Option>
              <Option value="INJECT">
                <b>INJECT</b> css & js to the matched webpage
              </Option>
            </Select>
          )}
        </FormItem>
        {this.getDetailInputs(formUtils)}
      </Fragment>
    )
  }

  getDetailInputs (formUtils: WrappedFormUtils) {
    switch (this.state.ruleType) {
      case EWebRuleType.REDIRECT:
        return <RedirectItems formUtils={formUtils} />
      case EWebRuleType.HEADER:
        return <HeaderItems formUtils={formUtils} />
      case EWebRuleType.UA:
      case EWebRuleType.UA_OUT:
        return <UaItems formUtils={formUtils} />
      case EWebRuleType.INJECT:
        return <InjectItems formUtils={formUtils} />
      default:
        return null
    }
  }
}
