import React, { Fragment } from 'react'
import { Form, Input } from 'antd'
import { IRuleItemProps } from './abatract'

const FormItem = Form.Item

export default function RedirectItems (props: IRuleItemProps) {
  const getFieldDecorator = props.formUtils.getFieldDecorator
  const prefix = props.prefix
  return (
    <Fragment>
      <FormItem label="Redirect to">
        {getFieldDecorator(`${prefix}.redirectUrl`, {
          rules: [{ required: true }]
        })(<Input />)}
      </FormItem>
    </Fragment>
  )
}
