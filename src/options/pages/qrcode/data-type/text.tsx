import newForm, { IFormConfig } from '@/options/components/form'
// import { formItemLayout } from './common'

const textFormConfig: IFormConfig = {
  onValuesChange (props: any, changedVals: any, allVals: any) {
    props.onChange && props.onChange((allVals.content || '').trim())
  },
  itemConfig: {
    wrapperCol: { span: 24 }
  },
  items: [
    {
      type: 'textarea',
      name: 'content',
      placeholder: 'qrcode.text.contentPlh',
      config: {
        autoFocus: true,
        style: { resize: 'none' },
        rows: 11
      }
    }
  ]
}

const TextForm = newForm(textFormConfig)

export default TextForm
