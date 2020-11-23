import { Component } from 'react'
import { IFromUtisProps } from '../common'

export interface IRuleItemState {
  idx: number
  type?: string
}

export interface IRuleItemProps extends IFromUtisProps {
  /** rule type */
  type: string
  /** rule field name prefix */
  prefix: any[]
}

// export type IRuleItemProps = IRuleItemExtraProps & IRuleItemState

interface ICountState {
  idx: number
  arr: IRuleItemState[]
}

export default abstract class SelectForm<Props extends IFromUtisProps = IFromUtisProps> extends Component<
  Props,
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
