// import React, { Fragment } from 'react'
// import { Form, Select, Input, Button, Row, Col } from 'antd'
// import AbstractForm, { IRuleItemProps } from './abatract'
// import { formItemLayout } from '../common'

// const FormList = Form.List
// const FormItem = Form.Item
// const Option = Select.Option

// const InjectItems: React.FC<IRuleItemProps> = (props: IRuleItemProps) => {
//   const prefix = props.prefix
//   return (
//     <>
//       {this.state.arr.map((item, k) => (
//         <Row
//           key={item.idx}
//           className="rule-group-item"
//           gutter={16}
//           align="middle"
//           type="flex"
//         >
//           <Col span={20}>
//             <Row gutter={16}>
//               <Col span={12}>
//                 <FormItem label="inject" {...formItemLayout}>
//                   {getFieldDecorator(`${prefix}.rules[${k}]type`, {
//                     rules: [{ required: true }]
//                   })(
//                     <Select>
//                       <Option value="css">CSS</Option>
//                       <Option value="js">Javascript</Option>
//                     </Select>
//                   )}
//                 </FormItem>
//               </Col>
//               <Col span={12}>
//                 <FormItem label="inject with" {...formItemLayout}>
//                   {getFieldDecorator(`${prefix}.rules[${k}]codeType`, {
//                     rules: [{ required: true }]
//                   })(
//                     <Select
//                       onChange={(v: string) => this.onTypeChange(item.idx, v)}
//                     >
//                       <Option value="code">Source Code</Option>
//                       <Option value="file">Remote Url</Option>
//                     </Select>
//                   )}
//                 </FormItem>
//               </Col>
//             </Row>
//             <FormItem label="Source code" {...formItemLayout}>
//               {getFieldDecorator(`${prefix}.rules[${k}]content`, {
//                 rules: [
//                   { required: true },
//                   { type: item.type === 'file' ? 'url' : 'string' }
//                 ]
//               })(item.type === 'code' ? <Input.TextArea /> : <Input />)}
//             </FormItem>
//           </Col>
//           <Col span={4}>
//             {this.state.arr.length > 1 ? (
//               <FormItem>
//                 <Button
//                   type="danger"
//                   onClick={() => this.removeRow(item.idx)}
//                 >
//                   Remove
//                 </Button>
//               </FormItem>
//             ) : null}
//           </Col>
//         </Row>
//       ))}
//       <Button onClick={this.addRow}>Add</Button>
//     </>
//   )

// }

// export default InjectItems
