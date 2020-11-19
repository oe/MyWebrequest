import React, { FunctionComponent} from 'react'
import { Form, Input, Switch } from 'antd'
import { FormInstance } from 'rc-field-form'
import { formItemLayout } from './common'
import validate from './validate'

const FormItem = Form.Item

const MatchForm: FunctionComponent = () => {
  return (<Input.Group {...formItemLayout}>
    <FormItem label="Match this url" name="matchUrl" rules={[{ required: true }, validateMatchUrl]}>
      <Input autoFocus placeholder="input placeholder" />
    </FormItem>
    <FormItem name="useReg" >
      <Switch
        checkedChildren="use regexp"
        // defaultChecked={this.state.useReg}
        // onChange={onInputChange.bind(this, 'useReg')}
        unCheckedChildren="use normal"
      />
    </FormItem>
  </Input.Group>)
}

function validateMatchUrl (form: FormInstance) {
  const validator = function (rule: any, value: string, callback: Function) {
    try {
      const matchURL = value.trim()
      validate.checkCustomMatchRule(matchURL, form.getFieldValue('useReg'))
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
  return { validator }
}