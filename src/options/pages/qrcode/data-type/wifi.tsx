import newForm, { IFormConfig } from '@/options/components/form'
import { formItemLayout } from './common'

const wifiFormConfig: IFormConfig = {
  itemConfig: formItemLayout,
  items: [
    {
      type: 'input',
      name: 'S',
      label: 'qrcode.wifi.SLabel',
      placeholder: 'qrcode.wifi.SPlh',
      config: {
        autoFocus: true
      }
    },
    {
      type: 'select',
      name: 'T',
      label: 'qrcode.wifi.TLabel',
      placeholder: 'qrcode.wifi.TPlh',
      decorator: {
        initialValue: 'WPA'
      },
      config: {
        options: [
          {
            value: 'nopass',
            label: 'qrcode.wifi.TOptionNopassLabel'
          },
          {
            value: 'WEP',
            label: 'qrcode.wifi.TOptionWEPLabel'
          },
          {
            value: 'WPA',
            label: 'qrcode.wifi.TOptionWPALabel'
          }
        ]
      }
    },
    {
      type: 'input',
      name: 'P',
      label: 'qrcode.wifi.PLabel',
      placeholder: 'qrcode.wifi.PPlh'
    }
  ]
}

const WifiForm = newForm(wifiFormConfig, {
  onValuesChange (props, changedVals: any, allVals: any) {
    let content = 'WIFI:'
    content += Object.keys(allVals)
      .map(key => `${key}:${allVals[key] || ''}`)
      .join(';')
    content += ';;'
    props.onChange && props.onChange(content)
  }
})

export default WifiForm
