import React, { Component, Fragment } from 'react'
import { Form, Select, Input, Button, Row, Col } from 'antd'
import { IFromUtisProps, formItemLayout } from '../common'

interface ICountState {
  idx: number
  arr: {
    idx: number;
    type?: string;
  }[]
}

export default abstract class SelectForm extends Component<
  IFromUtisProps,
  ICountState
  > {
  state: ICountState = { idx: 0, arr: [{ idx: 0 }] }

  addRow = () => {
    const idx = this.state.idx + 1
    const arr = this.state.arr.slice(0)
    arr.push({ idx })
    this.setState({
      idx,
      arr
    })
  }

  removeRow = (idx: number) => {
    const arr = this.state.arr.slice(0)
    this.setState({
      arr: arr.filter(v => v.idx !== idx)
    })
  }

  onTypeChange = (idx: number, v: string) => {
    const arr = this.state.arr.slice(0)
    const item = arr.find(itm => itm.idx === idx)
    if (!item) return
    item.type = v
    this.setState({ arr })
  }
  // should item show value colum
  hasHeaderValue = (idx: number) => {
    const item = this.state.arr.find(v => v.idx === idx)
    return item && item.type === 'update'
  }
}
