import newForm, { IFormConfig } from '@/options/components/form'
import { formItemLayout } from './common'

const messageFormConfig: IFormConfig = {
  itemConfig: formItemLayout,
  items: [
    {
      type: 'input',
      name: 'tel',
      label: 'To',
      placeholder: 'e.g. 18800000000',
      config: {
        autoFocus: true
      }
    },
    {
      type: 'textarea',
      name: 'content',
      label: 'Message',
      placeholder: 'Extra spaces will be removed',
      config: {
        style: { resize: 'none' },
        rows: 9
      }
    }
  ]
}

const MessageForm = newForm(messageFormConfig, {
  onValuesChange (props, changedVals: any, allVals: any) {
    const content = `SMSTO:${allVals.tel.trim()}:${allVals.content.trim()}`
    props.onChange && props.onChange(content)
  }
})

export default MessageForm
