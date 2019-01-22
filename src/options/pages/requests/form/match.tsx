import React, { Component } from 'react'
import { Form, Input, Switch } from 'antd'
import { ValidationRule } from 'antd/lib/form'
import { onInputChange } from '@/common/react-utils'
import { IFromUtisProps, formItemLayout } from './common'
import validate from './validate'

const FormItem = Form.Item

interface IState {
  useReg: boolean
}

export default class MatchForm extends Component<IFromUtisProps, IState> {
  constructor (props: IFromUtisProps) {
    super(props)
    this.state = { useReg: false }
  }
  getSwitch () {
    const getFieldDecorator = this.props.formUtils.getFieldDecorator
    return getFieldDecorator('useReg')(
      <Switch
        checkedChildren="use regexp"
        defaultChecked={this.state.useReg}
        onChange={onInputChange.bind(this, 'useReg')}
        unCheckedChildren="use normal"
      />
    )
  }
  render () {
    const getFieldDecorator = this.props.formUtils.getFieldDecorator
    return (
      <FormItem label="Match this url" {...formItemLayout}>
        {getFieldDecorator('matchUrl', { rules: [{ required: true }] })(
          <Input
            autoFocus
            placeholder="input placeholder"
            addonAfter={this.getSwitch()}
          />
        )}
      </FormItem>
    )
  }

  validateMatchUrl (rule: ValidationRule, value: string, callback: Function) {
    try {
      const matchURL = value.trim()
      validate.checkCustomMatchRule(matchURL, this.state.useReg)
      // const matchMeta = cstRule.getMatchMeta(matchURL, true, this.state.useReg)
      // const ignoreID = true // this.isUpdate && this.ruleID
      // if (!ignoreID && this.isRuleExist(matchMeta.url)) {
      // throw utils.createError('rule-exists')
      // }
      // this.isRuleIntersect(matchMeta.url, ignoreID)
      callback()
    } catch (e) {
      console.log(e)
      // return cb(new Error(this.$t('qrMakeMacBtn')))
      return callback(e)
    }
  }
}
