import React, { Component } from 'react'
import ActionForm from './action'
import MatchForm from './match'
// import { injectIntl, InjectedIntl } from 'react-intl'
import { Form } from 'antd'
import {
  GetFieldDecoratorOptions,
  WrappedFormUtils,
  FormComponentProps,
  FormCreateOption
} from 'antd/lib/form/Form'

interface IFormProps {
  onChange?: (val: string) => void
  onMounted?: (formUtils: WrappedFormUtils) => void
  // intl: InjectedIntl
}
type IFormCreateProps = IFormProps & FormComponentProps
// import {  connect } from 'react-redux'

class DetailForm extends Component<IFormCreateProps> {
  render () {
    const formUtils = this.props.form
    return (
      <Form>
        <MatchForm formUtils={formUtils} />
        <ActionForm formUtils={formUtils} />
      </Form>
    )
  }
}

export default function newForm (
  // config: IFormConfig,
  createOptions?: FormCreateOption<IFormCreateProps>
) {
  return Form.create(createOptions)(DetailForm)
}
