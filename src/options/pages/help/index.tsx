import React, { Component } from 'react'
import Title from '@/options/components/title'
import { injectIntl, InjectedIntl } from 'react-intl'

interface IProps {
  intl: InjectedIntl
}
class Help extends Component<IProps> {
  render () {
    const formatMessage = this.props.intl.formatMessage
    return (
      <div className="help-page">
        <Title
          title={formatMessage({ id: 'help.title' })}
          subtitle={formatMessage({ id: 'help.subtitle' })}
        />
      </div>
    )
  }
}

export default injectIntl(Help)
