import newForm, { IFormConfig } from '@/options/components/form'
import { formItemLayout } from './common'

const vcardFormConfig: IFormConfig = {
  itemConfig: formItemLayout,
  items: [
    {
      type: 'input',
      name: 'N',
      label: 'qrcode.vcard.NLabel',
      placeholder: 'qrcode.vcard.NPlh',
      config: {
        autoFocus: true
      }
    },
    {
      type: 'input',
      name: 'TEL',
      label: 'qrcode.vcard.TELLabel',
      placeholder: 'qrcode.vcard.TELPlh'
    },
    {
      type: 'input',
      name: 'EMAIL',
      label: 'qrcode.vcard.EMAILLabel',
      placeholder: 'qrcode.vcard.EMAILPlh'
    },
    {
      type: 'input',
      name: 'URL',
      label: 'qrcode.vcard.URLLabel',
      placeholder: 'qrcode.vcard.URLPlh'
    },
    {
      type: 'input',
      name: 'ADR',
      label: 'qrcode.vcard.ADRLabel',
      placeholder: 'qrcode.vcard.ADRPlh'
    },
    {
      type: 'textarea',
      name: 'NOTE',
      label: 'qrcode.vcard.NOTELabel',
      placeholder: 'qrcode.vcard.NOTEPlh',
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
