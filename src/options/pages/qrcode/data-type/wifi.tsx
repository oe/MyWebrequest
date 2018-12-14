import newForm, { IFormConfig } from '@/options/components/form'
import { formItemLayout } from './common'

const wifiFormConfig: IFormConfig = {
  itemConfig: formItemLayout,
  items: [
    {
      type: 'input',
      name: 'S',
      label: 'Wifi Name',
      placeholder: 'e.g. Daddy Shop',
      config: {
        autoFocus: true
      }
    },
    {
      type: 'select',
      name: 'T',
      label: 'Encryption',
      placeholder: 'Choose a encryption method',
      decorator: {
        initialValue: 'WPA'
      },
      config: {
        options: [
          {
            value: 'nopass',
            label: 'No encryption'
          },
          {
            value: 'WEP',
            label: 'WEP'
          },
          {
            value: 'WPA',
            label: 'WPA/WPA2'
          }
        ]
      }
    },
    {
      type: 'input',
      name: 'P',
      label: 'Password',
      placeholder: 'e.g. xxxxxx'
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
