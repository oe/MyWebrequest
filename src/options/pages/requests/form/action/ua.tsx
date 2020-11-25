import React from 'react'
import { Form, Input } from 'antd'
import { IRuleItemProps } from './abatract'

const FormItem = Form.Item

export default function UaItems (props: IRuleItemProps) {
  const prefix = props.prefix
  return (
    <FormItem label="Change Ua to" name={[...prefix, 'ua']} rules={[{ required: true }]}>
      <Input />
    </FormItem>
  )
}
