import React, { Component } from 'react'
import Title from '@/options/components/title'
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl'

interface IProps {
  intl: InjectedIntl
}
class Settings extends Component<IProps> {
  render () {
    const formatMessage = this.props.intl.formatMessage
    return (
      <div className="settings-page">
        <Title
          title={formatMessage({ id: 'settings.title' })}
          subtitle={formatMessage({ id: 'settings.subtitle' })}
        />
      </div>
    )
  }
}

export default injectIntl(Settings)
