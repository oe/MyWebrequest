import React, { createElement, Fragment, FunctionComponent } from 'react'
import { Form, Select, Button } from 'antd'
import { FormInstance } from 'rc-field-form'
import { MinusCircleOutlined } from '@ant-design/icons'
// import { WrappedFormUtils } from 'antd/lib/form/Form'
import { formItemLayout } from '../common'
import { EWebRuleType } from '@/types/requests'
import './index.scss'
import AbstractForm, { IRuleItemState } from './abatract'
import HeaderItems from './header'
// import InjectItems from './inject'
import UaItems from './ua'
import RedirectItems from './redirect'


const FormItem = Form.Item
const FormList = Form.List
const Option = Select.Option

const DETAIL_INPUTS_MAP = {
  [EWebRuleType.REDIRECT]: RedirectItems,
  [EWebRuleType.HEADER]: HeaderItems,
  [EWebRuleType.UA]: UaItems,
  [EWebRuleType.UA_OUT]: UaItems
  // [EWebRuleType.INJECT]: InjectItems
}

/** exclusive cmds, which can not coexist with other cmds */
const EXCLUSIVE_CMDS = ['REDIRECT', 'BLOCK', 'HSTS']

function isExclusive (cmd?: string) {
  if (!cmd) return false
  return EXCLUSIVE_CMDS.includes(cmd)
}

function shouldDisableOption (
  cmdCount: number,
  hasExclusive: boolean,
  cmd: string
) {
  return cmdCount > 1 && hasExclusive !== isExclusive(cmd)
}

const CMD_OPTIONS: { [k: string]: string } = {
  REDIRECT: '<b>Redirect</b> to a related url',
  BLOCK: '<b>Block</b> the request match the url',
  HSTS: '<b>HSTS</b> Force https connection',
  HEADER:
    '<b>Alter Header</b> Change http request header sent to the matched url(add/update/delete http header)',
  REFERRER:
    '<b>Remove referrer</b> to the matched url (this could enable hotlinking)',
  REFERRER_OUT:
    '<b>Remove referrer</b> from the matched webpage (this could protect your privacy)',
  UA: '<b>Change http request UA</b> to the matched url',
  UA_OUT: '<b>Change http request UA</b> from the matched webpage',
  CORS: '<b>Allow CORS origin request</b> to the matched url',
  CORS_OUT: '<b>Allow cross origin request</b> from the matched webpage',
  LOG: '<b>LOG</b> requests to the matched url',
  INJECT: '<b>INJECT</b> css & js to the matched webpage'
}

interface IProps {
  form: FormInstance
}

const ActionForm: React.FC<IProps> = ({ form }) => {
  return (<>
    <FormList name="rules">
      {(fields, {add, remove}, { errors }) => (
        <>
        {fields.map((field) => (
          <div className="rule-group" key={field.key}>
            {fields.length > 1 ? (
              <MinusCircleOutlined
                title="remove this rule"
                className="delete-remove-button"
                onClick={() => remove(field.name)}
              />
            ) : null}
            <FormItem label="What to do" {...formItemLayout} name={[field.name, "type"]} fieldKey={[field.fieldKey, 'type']} rules={[{required: true}]}>
              <Select showSearch placeholder="what you want to do with this url">
                {getSelectOptions(form)}
              </Select>
            </FormItem>
            {getDetailInputs(form, field.name)}
          </div>
        ))}
        <FormItem help={getAddBtnHelp(form)}>
          <Button onClick={() => add()} disabled={!canAddMoreRule(form)}>
            Add More rule
          </Button>
        </FormItem>
        </>
      )}
    </FormList>
  </>)
}

function getDetailInputs (form: FormInstance, idx: number) {
  const vals = form.getFieldValue('rules')
  if (!vals || !vals.length || !vals[idx]) return null
  const type = vals[idx].type
  // @ts-ignore
  const Inputs = DETAIL_INPUTS_MAP[type]
  if (Inputs) {
    return createElement(Inputs, {
      form,
      idx,
      type
    })
  } else {
    return null
  }
}

function getSelectOptions (form: FormInstance) {
  const vals = form.getFieldValue('rules')
  const hasExcl = hasExclusive(vals)
  const cmdCount = vals.length

  return Object.keys(CMD_OPTIONS).map(k => (
    <Option
      value={k}
      key={k}
      disabled={shouldDisableOption(cmdCount, hasExcl, k)}
    >
      <div dangerouslySetInnerHTML={{ __html: CMD_OPTIONS[k] }} />
    </Option>
  ))
}

function hasExclusive (vals: any[]) {
  return vals.some(item => isExclusive(item.type))
}

function getAddBtnHelp (form: FormInstance) {
  const vals = form.getFieldValue('rules')
  if (hasExclusive(vals)) {
    return (
      EXCLUSIVE_CMDS.join(',') +
      ' can not be coexisted with others, you won\'t be able to add other rule'
    )
  } else if (!hasCmd(vals)) {
    return 'You should config one rule before another'
  } else {
    return ''
  }
}

function hasCmd (vals: any[]) {
  return vals.some(item => Boolean(item.type))
}

function canAddMoreRule (form: FormInstance) {
  const vals = form.getFieldValue('rules')
  return hasCmd(vals) && !hasExclusive(vals)
}

export default ActionForm