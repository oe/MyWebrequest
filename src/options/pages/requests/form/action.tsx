import React, { Component, Fragment } from 'react'
import { Form, Select, Input } from 'antd'
import { IFromUtisProps, formItemLayout } from './common'
import './style.scss'

const FormItem = Form.Item
const Option = Select.Option

function RedirectItems () {
  return (
    <Fragment>
      <FormItem label="Redirect to">
        <Input />
      </FormItem>
    </Fragment>
  )
}

function HeaderItems () {
  return (
    <Fragment>
      <FormItem label="Header Name">
        <Input />
      </FormItem>
      <FormItem label="Header Value">
        <Input />
      </FormItem>
    </Fragment>
  )
}

function UaItems () {
  return (
    <Fragment>
      <FormItem label="Change Ua to">
        <Input />
      </FormItem>
    </Fragment>
  )
}

function InjectItems () {
  return (
    <Fragment>
      <FormItem label="Change Ua to">
        <Select>
          <Option value="css">CSS</Option>
          <Option value="js">Javascript</Option>
        </Select>
        <Select>
          <Option value="code">Source Code</Option>
          <Option value="file">Remote Url</Option>
        </Select>
      </FormItem>
    </Fragment>
  )
}

export default class ActionForm extends Component<IFromUtisProps> {
  render () {
    return (
      <Form className="config-group">
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
        <RedirectItems />
        <HeaderItems />
        <UaItems />
        <InjectItems />
      </Form>
    )
  }
}
