import React, { Component } from 'react'
import Title from '@/options/components/title'
import { injectIntl, WrappedComponentProps } from 'react-intl'


const Help: React.FC<WrappedComponentProps> = (props: WrappedComponentProps) => {
  const formatMessage = props.intl.formatMessage
  return (
    <div className="help-page">
      <Title
        title={formatMessage({ id: 'help.title' })}
        subtitle={formatMessage({ id: 'help.subtitle' })}
      />
    </div>
  )
}

export default Help
