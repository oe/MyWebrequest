/**
 * create dynamic forms
 */
import React, { Component, FormEvent } from 'react'
import { Input, Form, Select } from 'antd'
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
}
type IFormCreateProps = IFormProps & FormComponentProps

function createForm (config: IFormConfig) {
  return class EForm extends Component<IFormCreateProps> {
    render () {
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
}

function newForm (
  config: IFormConfig,
  createOptions?: FormCreateOption<IFormCreateProps>
) {
  return Form.create(createOptions)(createForm(config))
}

export default newForm
