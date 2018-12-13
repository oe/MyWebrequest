import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, Icon } from 'antd'
import { ClickParam } from 'antd/lib/menu'
import './navi.scss'
import pages from './pages'

export default class Navi extends Component {
  onClick (param: ClickParam) {
    console.log(param.key)
  }
  render () {
    return (
      <div className="navi">
        <span className="app-name">My Webrequest</span>
        <div className="navi-menu">
          {Object.keys(pages).map(pName => (
            <NavLink
              key={pName.toLocaleLowerCase()}
              className="navi-menu-item"
              to={'/' + pName.toLocaleLowerCase()}
              activeClassName="navi-selected"
            >
              {pName}
            </NavLink>
          ))}
        </div>
      </div>
    )
  }
}
