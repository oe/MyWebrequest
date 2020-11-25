/**
 * create dynamic forms
 */
import React, { FormEvent, useEffect, useRef } from 'react'
import { Input, Form, Select } from 'antd'
import { useIntl, IntlFormatters } from 'react-intl'
import { FormInstance } from 'rc-field-form'

import { FormItemProps } from 'antd/lib/form/FormItem'

interface IInputConfig {
  type: string
  name: string
  label?: string
  placeholder?: string
  initialValue?: any
  config?: { [k: string]: any }
}

export interface IFormConfig {
  isTranslated?: boolean
  onSubmit?: (evt: FormEvent) => void
  onValuesChange?: Function
  items: IInputConfig[]
  itemConfig?: FormItemProps
}

interface IFormElement {
  [k: string]: (
    // getFieldDecorator: WrappedFormUtils['getFieldDecorator'],
    item: IInputConfig,
    itemConfig: any
  ) => JSX.Element
}

const forms: IFormElement = {
  input: (config, itemConfig) => {
    const inputConfig = config.config || {}
    return (
      <Form.Item {...itemConfig} key={config.name} label={config.label} name={config.name} initialValue={config.initialValue}>
        <Input {...inputConfig} placeholder={config.placeholder} />
      </Form.Item>
    )
  },
  textarea: (config, itemConfig) => {
    const inputConfig = config.config || {}
    return (
      <Form.Item {...itemConfig} key={config.name} label={config.label} name={config.name} initialValue={config.initialValue}>
        <Input.TextArea {...inputConfig} placeholder={config.placeholder} />
      </Form.Item>
    )
  },
  select: (config, itemConfig) => {
    const inputConfig = Object.assign({}, config.config || {})
    const options = inputConfig.options
    delete inputConfig.options
    return (
      <Form.Item {...itemConfig} key={config.name} label={config.label} name={config.name} initialValue={config.initialValue}>
        <Select {...inputConfig} placeholder={config.placeholder}>
          {options.map((item: any) => (
            <Select.Option key={item.value} value={item.value}>
              {item.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    )
  }
}

interface IFormProps {
  onChange?: (val: string) => void
  onMounted?: (form: FormInstance) => void
}

function createForm (config: IFormConfig) {
  const CForm: React.FC<IFormProps> = (props: IFormProps) => {
    const { formatMessage } = useIntl()
    const [form] = Form.useForm()
    const ref = useRef<IFormConfig>(i18nConfig(formatMessage, config))
    useEffect(()=> {
      props.onMounted && props.onMounted(form)
    }, [])

    const onValuesChange = (changedVals: any, allVals: any) => {
      if (!config.onValuesChange) return
      config.onValuesChange(props, changedVals, allVals)
    }

    return (
      <Form onFinish={config.onSubmit ? config.onSubmit : undefined} form={form} onValuesChange={onValuesChange}>
        {ref.current.items.map(item => {
          return forms[item.type](
            item,
            config.itemConfig
          )
        })}
      </Form>
    )
  }
  return CForm
}

function i18nConfig (formatMessage: IntlFormatters['formatMessage'], formConfig: IFormConfig) {
  if (formConfig.isTranslated) return formConfig
  formConfig.items.forEach(inputConfig => {
    if (inputConfig.label) {
      inputConfig.label = formatMessage({ id: inputConfig.label })
    }
    if (inputConfig.placeholder) {
      inputConfig.placeholder = formatMessage({
        id: inputConfig.placeholder
      })
    }
    if (
      inputConfig.type === 'select' &&
      inputConfig.config &&
      inputConfig.config.options
    ) {
      inputConfig.config.options.forEach((item: any) => {
        item.label = formatMessage({
          id: item.label
        })
      })
    }
  })
  formConfig.isTranslated = true
  return formConfig
}

export default createForm
