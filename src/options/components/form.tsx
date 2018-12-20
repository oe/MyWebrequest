/**
 * create dynamic forms
 */
import React, { Component, FormEvent } from 'react'
import { Input, Form, Select } from 'antd'
import { injectIntl, InjectedIntl } from 'react-intl'
import {
  GetFieldDecoratorOptions,
  WrappedFormUtils,
  FormComponentProps,
  FormCreateOption
} from 'antd/lib/form/Form'

import { FormItemProps } from 'antd/lib/form/FormItem'

interface IInputConfig {
  type: string
  name: string
  label?: string
  placeholder?: string
  decorator?: GetFieldDecoratorOptions
  config?: { [k: string]: any }
}

export interface IFormConfig {
  onSubmit?: (evt: FormEvent) => void
  items: IInputConfig[]
  itemConfig?: FormItemProps
}

interface IFormElement {
  [k: string]: (
    getFieldDecorator: WrappedFormUtils['getFieldDecorator'],
    item: IInputConfig,
    itemConfig: any
  ) => JSX.Element
}

const forms: IFormElement = {
  input: (getFieldDecorator, config, itemConfig) => {
    const inputConfig = config.config || {}
    return (
      <Form.Item {...itemConfig} key={config.name} label={config.label}>
        {getFieldDecorator(config.name, config.decorator)(
          <Input {...inputConfig} placeholder={config.placeholder} />
        )}
      </Form.Item>
    )
  },
  textarea: (getFieldDecorator, config, itemConfig) => {
    const inputConfig = config.config || {}
    return (
      <Form.Item {...itemConfig} key={config.name} label={config.label}>
        {getFieldDecorator(config.name, config.decorator)(
          <Input.TextArea {...inputConfig} placeholder={config.placeholder} />
        )}
      </Form.Item>
    )
  },
  select: (getFieldDecorator, config, itemConfig) => {
    const inputConfig = Object.assign({}, config.config || {})
    const options = inputConfig.options
    delete inputConfig.options
    return (
      <Form.Item {...itemConfig} key={config.name} label={config.label}>
        {getFieldDecorator(config.name, config.decorator)(
          <Select {...inputConfig} placeholder={config.placeholder}>
            {options.map((item: any) => (
              <Select.Option key={item.value} value={item.value}>
                {item.label}
              </Select.Option>
            ))}
          </Select>
        )}
      </Form.Item>
    )
  }
}

interface IFormProps {
  onChange?: (val: string) => void
  onMounted?: (formUtils: WrappedFormUtils) => void
  intl: InjectedIntl
}
type IFormCreateProps = IFormProps & FormComponentProps

function createForm (config: IFormConfig) {
  class EForm extends Component<IFormCreateProps> {
    hasTranslated = false
    componentDidMount () {
      this.props.onMounted && this.props.onMounted(this.props.form)
    }
    i18nConfig (inputConfigs: IInputConfig[]) {
      if (this.hasTranslated) return inputConfigs
      const formatMessage = this.props.intl.formatMessage
      inputConfigs.forEach(inputConfig => {
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
      this.hasTranslated = true
      return inputConfigs
    }
    render () {
      this.i18nConfig(config.items)
      return (
        <Form onSubmit={config.onSubmit ? config.onSubmit : undefined}>
          {config.items.map(item => {
            return forms[item.type](
              this.props.form.getFieldDecorator,
              item,
              config.itemConfig
            )
          })}
        </Form>
      )
    }
  }
  return injectIntl(EForm)
}

function newForm (
  config: IFormConfig,
  createOptions?: FormCreateOption<IFormCreateProps>
) {
  return Form.create(createOptions)(createForm(config))
}

export default newForm
