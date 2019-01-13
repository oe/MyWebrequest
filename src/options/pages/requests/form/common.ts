import { FormItemProps } from 'antd/lib/form/FormItem'

import {
  WrappedFormUtils
} from 'antd/lib/form/Form'

export interface IFromUtisProps {
  formUtils: WrappedFormUtils
}

export const formItemLayout: Readonly<FormItemProps> = {
  colon: false,
  // labelCol: { span: 3 },
  // wrapperCol: { span: 21 }
}