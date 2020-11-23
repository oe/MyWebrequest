import React, { Fragment } from 'react'
import { Form, Input } from 'antd'
import { IRuleItemProps } from './abatract'

const FormItem = Form.Item

export default function RedirectItems (props: IRuleItemProps) {
  const prefix = props.prefix
  return (
    <FormItem label="Redirect to" name={[...prefix, 'redirectUrl']} fieldKey={name} rules={[{ required: true }]}>
      <Input />
    </FormItem>
  )
}
