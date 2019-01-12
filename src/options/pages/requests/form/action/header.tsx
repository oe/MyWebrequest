import React, { Fragment } from 'react'
import { Form, Select, Input, Button, Row, Col } from 'antd'

import AbstractForm from './abatract'

const FormItem = Form.Item
const Option = Select.Option

export default class HeaderItems extends AbstractForm {
  // should item show value colum
  hasHeaderValue = (idx: number) => {
    const item = this.state.arr.find(v => v.idx === idx)
    return item && item.type === 'update'
  }

  render () {
    const getFieldDecorator = this.props.formUtils.getFieldDecorator
    return (
      <Fragment>
        <Row gutter={16}>
          <Col span={6}>Action</Col>
          <Col span={6}>Header Name</Col>
          <Col span={8}>Header Value</Col>
        </Row>
        {this.state.arr.map((i, k) => (
          <Row key={i.idx} gutter={16}>
            <Col span={6}>
              <FormItem>
                {getFieldDecorator(`rules[${k}]type`)(
                  <Select onChange={(v: string) => this.onTypeChange(i.idx, v)}>
                    <Option value="update">Update Header</Option>
                    <Option value="delete">Remove Header</Option>
                  </Select>
                )}
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem>
                {getFieldDecorator(`rules[${k}]name`)(<Input />)}
              </FormItem>
            </Col>
            <Col span={8}>
              <FormItem>
                {this.hasHeaderValue(i.idx)
                  ? getFieldDecorator(`rules[${k}]val`)(<Input />)
                  : '---'}
              </FormItem>
            </Col>
            <Col span={4}>
              {this.state.arr.length > 1 ? (
                <FormItem>
                  <Button type="danger" onClick={() => this.removeRow(i.idx)}>
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
