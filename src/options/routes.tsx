import React, { Component } from 'react'
import { Route } from 'react-router-dom'
import pages from './pages'
export default class Routes extends Component {
  render () {
    return (
      <div className="pages">
        {Object.keys(pages).map(pName => (
          <Route
            key={pName}
            path={'/' + pName.toLocaleLowerCase()}
            component={pages[pName]}
          />
        ))}
      </div>
    )
  }
}
