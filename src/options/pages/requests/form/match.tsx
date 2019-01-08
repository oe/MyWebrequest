import React, { Component } from 'react'
import { Form, Input, Switch } from 'antd'
import { IFromUtisProps, formItemLayout } from './common'
const FormItem = Form.Item

export default class MatchForm extends Component<IFromUtisProps> {
  getSwitch () {
    return (
      <div>
        <Switch checkedChildren="use regexp" unCheckedChildren="use normal" />
      </div>
    )
  }
  render () {
    return (
      <FormItem label="Match this url" {...formItemLayout}>
        <Input
          autoFocus
          placeholder="input placeholder"
          addonAfter={this.getSwitch()}
        />
      </FormItem>
    )
  }
}
