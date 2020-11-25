import React, { Component } from 'react'
import Title from '@/options/components/title'
import { injectIntl, WrappedComponentProps } from 'react-intl'
import ExtIcon from './ext-icon'
import DataSync from './data-sync'

class Settings extends Component<WrappedComponentProps> {
  componentWillMount () {
    // this.props.getCommits('evecalm/truncate-html')
  }
  render () {
    const formatMessage = this.props.intl.formatMessage
    return (
      <div className="settings-page">
        <Title
          title={formatMessage({ id: 'settings.title' })}
          subtitle={formatMessage({ id: 'settings.subtitle' })}
        />
        <ExtIcon />
        <DataSync />
        {this.getList()}
      </div>
    )
  }
  getList () {
    return null
    // if (this.props.commits) {
    //   return (
    //     <ul>
    //       {this.props.commits.map(item => (
    //         <li key={item.sha}>
    //           <h3>
    //             {item.commit.committer.name}
    //             <small>{item.commit.committer.date}</small>
    //           </h3>
    //           <a href={item.html_url}>{item.commit.message}</a>
    //         </li>
    //       ))}
    //     </ul>
    //   )
    // } else {
    //   return null
    // }
  }
}

export default injectIntl(Settings)
