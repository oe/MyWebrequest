import React, { Component } from 'react'
// import { Link } from 'react-router-dom'
import { Menu, Icon } from 'antd'
import { ClickParam } from 'antd/lib/menu'
import './navi.scss'

export default class Navi extends Component {
  onClick (param: ClickParam) {
    console.log(param.key)
  }
  render () {
    return (
      <div className="navi">
        <span className="app-name">My Webrequest</span>
        <Menu mode="inline" onClick={this.onClick.bind(this)}>
          <Menu.Item key="requests">
            Web requests
            {/* <Link to="/requests">Web requests</Link> */}
          </Menu.Item>
          <Menu.Item key="menu">ContextMenu</Menu.Item>
          <Menu.Item key="settings">Settings</Menu.Item>
          <Menu.Item key="help">Help</Menu.Item>
        </Menu>
      </div>
    )
  }
}
