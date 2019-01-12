import React, { Fragment } from 'react'
import { Form, Select, Input, Button, Row, Col } from 'antd'
import AbstractForm from './abatract'

const FormItem = Form.Item
const Option = Select.Option

export default class InjectItems extends AbstractForm {
  // should item show value colum
  shouldShowCode = (idx: number) => {
    const item = this.state.arr.find(v => v.idx === idx)
    return item && item.type === 'code'
  }

  render () {
    const getFieldDecorator = this.props.formUtils.getFieldDecorator
    return (
      <Fragment>
        {this.state.arr.map((i, k) => (
          <Fragment key={i.idx}>
            <Row gutter={16}>
              <Col span={8}>
                <FormItem label="inject">
                  {getFieldDecorator(`rules[${k}]type`)(
                    <Select>
                      <Option value="css">CSS</Option>
                      <Option value="js">Javascript</Option>
                    </Select>
                  )}
                </FormItem>
              </Col>
              <Col span={8}>
                <FormItem label="inject with">
                  {getFieldDecorator(`rules[${k}]codeType`)(
                    <Select
                      onChange={(v: string) => this.onTypeChange(i.idx, v)}
                    >
                      <Option value="code">Source Code</Option>
                      <Option value="file">Remote Url</Option>
                    </Select>
                  )}
                </FormItem>
              </Col>
            </Row>
            <FormItem>
              {getFieldDecorator(`rules[${k}]content`)(
                this.shouldShowCode(i.idx) ? <Input.TextArea /> : <Input />
              )}
            </FormItem>
          </Fragment>
        ))}
        <Button onClick={this.addRow}>Add</Button>
      </Fragment>
    )
  }
}
