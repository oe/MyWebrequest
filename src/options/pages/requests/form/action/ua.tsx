import React, { Fragment } from 'react'
import { Form, Input } from 'antd'
import { IRuleItemProps } from './abatract'

const FormItem = Form.Item

export default function UaItems (props: IRuleItemProps) {
  const getFieldDecorator = props.formUtils.getFieldDecorator
  const prefix = props.prefix
  return (
    <Fragment>
      <FormItem label="Change Ua to">
        {getFieldDecorator(`${prefix}.ua`, { rules: [{ required: true }] })(
          <Input />
        )}
      </FormItem>
    </Fragment>
  )
}
