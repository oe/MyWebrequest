import React, { Component, FormEvent } from 'react'
import ActionForm from './action'
import MatchForm from './match'
// import { injectIntl, InjectedIntl } from 'react-intl'
import { Form, Button } from 'antd'
import {
  WrappedFormUtils,
  FormComponentProps
} from 'antd/lib/form/Form'

interface IFormProps {
  onChange?: (val: string) => void
  onMounted?: (formUtils: WrappedFormUtils) => void
  // intl: InjectedIntl
}
type IFormCreateProps = IFormProps & FormComponentProps
// import {  connect } from 'react-redux'

class DetailForm extends Component<IFormCreateProps> {
  onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.warn('Received values of form: ', values)
      } else {
        console.log('form data', values)
      }
    })
  }
  render () {
    const formUtils = this.props.form
    return (
      <Form onSubmit={this.onSubmit}>
        <MatchForm formUtils={formUtils} />
        <ActionForm formUtils={formUtils} />

        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form>
    )
  }
}

export default Form.create()(DetailForm)
