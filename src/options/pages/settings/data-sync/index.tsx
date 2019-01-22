import React, { Component, Fragment } from 'react'
import Title from '@/options/components/title'
import collection from '@/common/collection'
// import { Radio } from 'antd'

// const RadioGroup = Radio.Group

import { injectIntl, InjectedIntl } from 'react-intl'

interface IProps {
  intl: InjectedIntl
}
interface IState {
  iconStyle: string
}

class DataSync extends Component<IProps, IState> {
  constructor (props: IProps) {
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
          title={formatMessage({ id: 'settings.datasync.title' })}
        />
        Lorem ipsum dolor sit amet consectetur, adipisicing elit. Error
        reprehenderit accusamus enim aut labore, facere sint repudiandae,
        asperiores odio nemo facilis maxime vel at libero consequatur dolore
        debitis. Magnam, ullam?
      </Fragment>
    )
  }
}

export default injectIntl(DataSync)
