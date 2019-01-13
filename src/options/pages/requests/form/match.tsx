import React, { Component } from 'react'
import { Form, Input, Switch } from 'antd'
import { IFromUtisProps, formItemLayout } from './common'
const FormItem = Form.Item

export default class MatchForm extends Component<IFromUtisProps> {
  getSwitch () {
    const getFieldDecorator = this.props.formUtils.getFieldDecorator
    return getFieldDecorator('useReg')(
      <Switch checkedChildren="use regexp" unCheckedChildren="use normal" />
    )
  }
  render () {
    const getFieldDecorator = this.props.formUtils.getFieldDecorator
    return (
      <FormItem label="Match this url" {...formItemLayout}>
        {getFieldDecorator('matchUrl', { rules: [{ required: true }] })(
          <Input
            autoFocus
            placeholder="input placeholder"
            addonAfter={this.getSwitch()}
          />
        )}
      </FormItem>
    )
  }
}
