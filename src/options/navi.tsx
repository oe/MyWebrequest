import React, { Component } from 'react'
import { NavLink } from 'react-router-dom'
import { FormattedMessage } from 'react-intl'
import './navi.scss'
import pages from './pages'

const Navi:React.FC = () => {
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
            <FormattedMessage id={pName.toLocaleLowerCase() + '.title'} />
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export default Navi
