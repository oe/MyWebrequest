import newForm, { IFormConfig } from '@/options/components/form'
import { formItemLayout } from './common'

const vcardFormConfig: IFormConfig = {
  itemConfig: formItemLayout,
  items: [
    {
      type: 'input',
      name: 'N',
      label: 'Name',
      placeholder: 'e.g. John Smith',
      config: {
        autoFocus: true
      }
    },
    {
      type: 'input',
      name: 'TEL',
      label: 'Phone',
      placeholder: 'e.g. 18800000000'
    },
    {
      type: 'input',
      name: 'EMAIL',
      label: 'Email',
      placeholder: 'e.g. sir@sample.com'
    },
    {
      type: 'input',
      name: 'URL',
      label: 'Home Page',
      placeholder: 'e.g. http://www.evecalm.com'
    },
    {
      type: 'input',
      name: 'ADR',
      label: 'Address',
      placeholder: 'e.g. NewTon Avu, NYC'
    },
    {
      type: 'textarea',
      name: 'NOTE',
      label: 'Meno',
      placeholder: 'e.g. The guy in blue T-shirt',
      config: {
        style: { resize: 'none' },
        rows: 2
      }
    }
  ]
}

const VcardForm = newForm(vcardFormConfig, {
  onValuesChange (props, changedVals: any, allVals: any) {
    console.log('xxxx')
    let content = 'BEGIN:VCARD\nVERSION:3.0\n'
    content += Object.keys(allVals)
      .map(key => `${key}:${allVals[key] || ''}`)
      .join('\n')
    content += '\nEND:VCARD'
    props.onChange && props.onChange(content)
  }
})
export default VcardForm
