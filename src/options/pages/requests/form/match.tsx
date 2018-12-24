import React, { Component } from 'react'
import { Form, Input, Switch } from 'antd'
import { formItemLayout } from './common'

const FormItem = Form.Item

export default class MatchForm extends Component {
  getSwitch () {
    return (
      <div>
        <Switch checkedChildren="use regexp" unCheckedChildren="use normal" />
      </div>
    )
  }
  render () {
    return (
      <Form>
        <FormItem label="Match this url" {...formItemLayout}>
          <Input
            autoFocus
            placeholder="input placeholder"
            addonAfter={this.getSwitch()}
          />
        </FormItem>
      </Form>
    )
  }
}
