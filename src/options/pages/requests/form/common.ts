import { FormItemProps } from 'antd/lib/form/FormItem'

import { FormInstance } from 'rc-field-form'

export interface IFromUtisProps {
  form: FormInstance
}

export const formItemLayout: Readonly<FormItemProps> = {
  colon: false,
  labelCol: { span: 3 },
  wrapperCol: { span: 21 }
}