import React, { Component } from 'react'
import { Form, Select } from 'antd'
import { formItemLayout } from './common'

const FormItem = Form.Item
const Option = Select.Option

export default class ActionForm extends Component {
  render () {
    return (
      <Form>
        <FormItem label="What to do" {...formItemLayout}>
          <Select showSearch placeholder="what you want to do with this url">
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
              <b>Alter Header</b> Change http request header sent to the matched
              url(add/update/delete http header)
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
            <Option value="CORS_OUT">
              <b>INJECT</b> css & js to the matched webpage
            </Option>
          </Select>
        </FormItem>
      </Form>
    )
  }
}
