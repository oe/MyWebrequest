import React, { Component } from 'react'
import Title from '@/options/components/title'
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl'

interface IProps {
  intl: InjectedIntl
}
class Contextmenu extends Component<IProps> {
  render () {
    const formatMessage = this.props.intl.formatMessage
    return (
      <div className="contextmenu-page">
        <Title
          title={formatMessage({ id: 'contextmenu.title' })}
          subtitle={formatMessage({ id: 'contextmenu.subtitle' })}
        />
      </div>
    )
  }
}

export default injectIntl(Contextmenu)
