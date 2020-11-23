import React, { Component } from 'react'
import Title from '@/options/components/title'
import { useIntl } from 'react-intl'


const Contextmenu: React.FC = () => {
  const { formatMessage } = useIntl()
  return (
    <div className="contextmenu-page">
      <Title
        title={formatMessage({ id: 'contextmenu.title' })}
        subtitle={formatMessage({ id: 'contextmenu.subtitle' })}
      />
    </div>
  )
}

export default Contextmenu
