import newForm, { IFormConfig } from '@/options/components/form'
// import { formItemLayout } from './common'

const textFormConfig: IFormConfig = {
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

const TextForm = newForm(textFormConfig, {
  onValuesChange (props, changedVals: any, allVals: any) {
    props.onChange && props.onChange((allVals.content || '').trim())
  }
})

export default TextForm