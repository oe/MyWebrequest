import React, { Component, Fragment } from 'react'
import Title from '@/options/components/title'
import collection from '@/common/collection'
import { onInputChange } from '@/common/react-utils'
import { Radio } from 'antd'

import './index.scss'

const RadioGroup = Radio.Group

import { injectIntl, WrappedComponentProps } from 'react-intl'

interface IState {
  iconStyle: string
}

class ExtIcon extends Component<WrappedComponentProps, IState> {
  constructor (props: WrappedComponentProps) {
    super(props)
    this.state = {
      iconStyle: collection.getConfig('iconStyle') || 'colored'
    }
  }
  render () {
    const formatMessage = this.props.intl.formatMessage
    return (
      <Fragment>
        <Title
          middle
          title={formatMessage({ id: 'settings.extension.title' })}
        />
        <RadioGroup
          value={this.state.iconStyle}
          className="exticon-style-cards"
          onChange={onInputChange.bind(this, 'iconStyle')}
        >
          <div className="exticon-style-card colored">
            <Radio value="colored">
              {formatMessage({ id: 'settings.extension.colored' })}
            </Radio>
          </div>
          <div className="exticon-style-card grey">
            <Radio value="grey">
              {formatMessage({ id: 'settings.extension.grey' })}
            </Radio>
          </div>
        </RadioGroup>
      </Fragment>
    )
  }
}

export default injectIntl(ExtIcon)
