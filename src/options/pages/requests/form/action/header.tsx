import React, { Fragment } from 'react'
import { Form, Select, Input, Button, Row, Col } from 'antd'
import AbstractForm, { IRuleItemProps } from './abatract'

const FormItem = Form.Item
const Option = Select.Option

export default class HeaderItems extends AbstractForm<IRuleItemProps> {
  render () {
    const getFieldDecorator = this.props.formUtils.getFieldDecorator
    const prefix = this.props.prefix
    return (
      <Fragment>
        <Row gutter={16}>
          <Col span={5}>Action</Col>
          <Col span={6}>Header Name</Col>
          <Col span={9}>Header Value</Col>
        </Row>
        {this.state.arr.map((item, k) => (
          <Row className="rule-group-item" key={item.idx} gutter={16}>
            <Col span={5}>
              <FormItem>
                {getFieldDecorator(`${prefix}.rules[${k}].type`, {
                  rules: [{ required: true }]
                })(
                  <Select
                    onChange={(v: string) => this.onTypeChange(item.idx, v)}
                  >
                    <Option value="update">Update Header</Option>
                    <Option value="delete">Remove Header</Option>
                  </Select>
                )}
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem>
                {getFieldDecorator(`${prefix}.rules[${k}]name`)(<Input />)}
              </FormItem>
            </Col>
            <Col span={9}>
              <FormItem>
                {item.type === 'update'
                  ? getFieldDecorator(`${prefix}.rules[${k}]val`, {
                      rules: [{ required: true }]
                    })(<Input />)
                  : '---'}
              </FormItem>
            </Col>
            <Col span={4}>
              {this.state.arr.length > 1 ? (
                <FormItem>
                  <Button
                    type="danger"
                    onClick={() => this.removeRow(item.idx)}
                  >
                    Remove
                  </Button>
                </FormItem>
              ) : null}
            </Col>
          </Row>
        ))}
        <Button onClick={this.addRow}>Add</Button>
      </Fragment>
    )
  }
}
