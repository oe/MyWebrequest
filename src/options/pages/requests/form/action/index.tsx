import React, { createElement, Fragment, FunctionComponent } from 'react'
import { Form, Select, Button, Icon } from 'antd'
// import { WrappedFormUtils } from 'antd/lib/form/Form'
import { formItemLayout } from '../common'
import { EWebRuleType } from '@/types/requests'
import './index.scss'

import AbstractForm, { IRuleItemState } from './abatract'
import HeaderItems from './header'
import InjectItems from './inject'
import UaItems from './ua'
import RedirectItems from './redirect'

const FormItem = Form.Item
const Option = Select.Option

const DETAIL_INPUTS_MAP = {
  [EWebRuleType.REDIRECT]: RedirectItems,
  [EWebRuleType.HEADER]: HeaderItems,
  [EWebRuleType.UA]: UaItems,
  [EWebRuleType.UA_OUT]: UaItems,
  [EWebRuleType.INJECT]: InjectItems
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

// const AF: FunctionComponent = () => {
//   return (<>
  
//   </>)
// }

export default class ActionForm extends AbstractForm {
  render () {
    const formUtils = this.props.formUtils
    const getFieldDecorator = formUtils.getFieldDecorator
    return (
      <Fragment>
        {this.state.arr.map((item, idx) => (
          <div className="rule-group" key={item.idx}>
            {this.state.arr.length > 1 ? (
              <Icon
                title="remove this rule"
                className="delete-remove-button"
                type="minus-circle-o"
                onClick={() => this.removeRow(item.idx)}
              />
            ) : null}
            <FormItem label="What to do" {...formItemLayout}>
              {getFieldDecorator(`rules[${idx}].cmd`, {
                rules: [{ required: true }]
              })(
                <Select
                  onChange={(v: string) => this.onTypeChange(item.idx, v)}
                  showSearch
                  placeholder="what you want to do with this url"
                >
                  {this.getSelectOptions()}
                </Select>
              )}
            </FormItem>
            {this.getDetailInputs(item, `rules[${idx}]`, formUtils)}
          </div>
        ))}
        <FormItem help={this.getAddBtnHelp()}>
          <Button onClick={this.addRow} disabled={!this.canAddMoreRule()}>
            Add More rule
          </Button>
        </FormItem>
      </Fragment>
    )
  }

  getAddBtnHelp = () => {
    if (this.hasExclusive()) {
      return (
        EXCLUSIVE_CMDS.join(',') +
        ' can not be coexisted with others, you won\'t be able to add other rule'
      )
    } else if (!this.hasCmd()) {
      return 'You should config one rule before another'
    } else {
      return ''
    }
  }

  hasExclusive () {
    return this.state.arr.some(item => isExclusive(item.type))
  }

  hasCmd () {
    return this.state.arr.some(item => Boolean(item.type))
  }

  canAddMoreRule = () => {
    return this.hasCmd() && !this.hasExclusive()
  }

  getSelectOptions () {
    const hasExclusive = this.hasExclusive()
    const cmdCount = this.state.arr.length

    return Object.keys(CMD_OPTIONS).map(k => (
      <Option
        value={k}
        key={k}
        disabled={shouldDisableOption(cmdCount, hasExclusive, k)}
      >
        <div dangerouslySetInnerHTML={{ __html: CMD_OPTIONS[k] }} />
      </Option>
    ))
  }

  getDetailInputs (
    item: IRuleItemState,
    prefix: string,
    formUtils: WrappedFormUtils
  ) {
    // @ts-ignore
    const Inputs = DETAIL_INPUTS_MAP[item.type]
    if (Inputs) {
      return createElement(Inputs, {
        formUtils,
        prefix,
        type: item.type
      })
    } else {
      return null
    }
  }
}
