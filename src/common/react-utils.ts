import { Component } from 'react'

// listen input element change event
export function onInputChange (this: Component<any, any>, key: string, evt: any) {
  this.setState({
    [key]: evt.target.value
  })
}