import React, { Component, ChangeEvent } from 'react'
import './editor.scss'

interface IProps {
  initVal: string
  onSubmit?: (val: string) => void
}

interface IState {
  val: string
}

export default class Editor extends Component<IProps, IState> {
  constructor (props: IProps) {
    super(props)
    this.state = { val: props.initVal }
  }
  ta!: HTMLTextAreaElement
  componentDidMount () {
    setTimeout(() => {
      this.ta.select()
      this.ta.focus()
    }, 10)
  }
  onValChange (evt: ChangeEvent<HTMLTextAreaElement>) {
    this.setState({ val: evt.target.value })
  }
  onSubmit () {
    if (this.props.onSubmit) {
      this.props.onSubmit(this.state.val)
    }
  }
  render () {
    return (
      <div className="text-container">
        <textarea
          ref={ta => (this.ta = ta!)}
          value={this.state.val}
          onChange={this.onValChange.bind(this)}
        />
        <div className="action-btn">
          <button type="button" onClick={this.onSubmit.bind(this)}>
            Submit
          </button>
          <a href="/options/index.html#qrcode" target="_blank">
            more
          </a>
        </div>
      </div>
    )
  }
}
