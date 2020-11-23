import React, { Fragment } from 'react'
import { Form, Select, Input, Button, Row, Col } from 'antd'
import AbstractForm, { IRuleItemProps } from './abatract'

const FormList = Form.List
const FormItem = Form.Item
const Option = Select.Option


const HeaderItems: React.FC<IRuleItemProps> = (props: IRuleItemProps) => {
  const prefix = props.prefix
  return (
    <>
      <Row gutter={16}>
        <Col span={5}>Action</Col>
        <Col span={6}>Header Name</Col>
        <Col span={9}>Header Value</Col>
      </Row>
      <FormList name="headers">
        {(fields, {add, remove}, { errors }) => (
          <>
          {fields.map((field) => (
            <Row className="rule-group-item" key={field.key} gutter={16}>
              <Col span={5}>
                <FormItem name={[...prefix, field.name, 'type']} rules={[{ required: true }]}>
                  <Select>
                    <Option value="update">Update Header</Option>
                    <Option value="delete">Remove Header</Option>
                  </Select>
                </FormItem>
              </Col>
              <Col span={6}>
                <FormItem name={[...prefix, field.name, 'name']} rules={[{ required: true }]}>
                  <Input />
                </FormItem>
              </Col>
              <Col span={9}>
                {props.form.getFieldValue([...prefix, field.name, 'type']) === 'update' ?
                  <FormItem name={[...prefix, field.name, 'val']} rules={[{ required: true }]}>
                    <Input />
                  </FormItem>
                  : '---'
                }
              </Col>
              <Col span={4}>
                {props.form.getFieldValue(prefix).length > 1 ? (
                  <FormItem>
                    <Button
                      danger
                      onClick={() => remove(field.name)}
                    >
                      Remove
                    </Button>
                  </FormItem>
                ) : null}
              </Col>
            </Row>
          ))}
          <Button onClick={() => add()}>Add</Button>
          </>
        )}
      </FormList>
    </>
  )

}

export default HeaderItems