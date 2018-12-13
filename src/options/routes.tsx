import React, { Component } from 'react'
import { Route } from 'react-router-dom'
// @ts-ignore
import { spring, AnimatedSwitch } from 'react-router-transition'
import pages from './pages'

function mapStyles (styles: any) {
  return {
    opacity: styles.opacity,
    transform: `scale(${styles.scale})`
  }
}

// wrap the `spring` helper to use a bouncy config
function bounce (val: number) {
  return spring(val, {
    stiffness: 330,
    damping: 22
  })
}

// child matches will...
const bounceTransition = {
  // start in a transparent, upscaled state
  atEnter: {
    opacity: 0,
    scale: 1
  },
  // leave in a transparent, downscaled state
  atLeave: {
    opacity: bounce(0),
    scale: bounce(0.9)
  },
  // and rest at an opaque, normally-scaled state
  atActive: {
    opacity: bounce(1),
    scale: bounce(1)
  }
}

export default class Routes extends Component {
  render () {
    return (
      <AnimatedSwitch
        className="pages"
        atEnter={bounceTransition.atEnter}
        atLeave={bounceTransition.atLeave}
        atActive={bounceTransition.atActive}
        mapStyles={mapStyles}
      >
        {Object.keys(pages).map(pName => (
          <Route
            exact
            key={pName}
            path={'/' + pName.toLocaleLowerCase()}
            component={pages[pName]}
          />
        ))}
      </AnimatedSwitch>
    )
  }
}
