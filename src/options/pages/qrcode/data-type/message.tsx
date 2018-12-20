import newForm, { IFormConfig } from '@/options/components/form'
import { formItemLayout } from './common'

const messageFormConfig: IFormConfig = {
  itemConfig: formItemLayout,
  items: [
    {
      type: 'input',
      name: 'tel',
      label: 'qrcode.message.telLabel',
      placeholder: 'qrcode.message.telPlh',
      config: {
        autoFocus: true
      }
    },
    {
      type: 'textarea',
      name: 'content',
      label: 'qrcode.message.contentLabel',
      placeholder: 'qrcode.message.contentPlh',
      config: {
        style: { resize: 'none' },
        rows: 9
      }
    }
  ]
}

const MessageForm = newForm(messageFormConfig, {
  onValuesChange (props, changedVals: any, allVals: any) {
    const content = `SMSTO:${(allVals.tel || '').trim()}:${(
      allVals.content || ''
    ).trim()}`
    props.onChange && props.onChange(content)
  }
})

export default MessageForm
