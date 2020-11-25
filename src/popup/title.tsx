import React from 'react'
import './title.scss'

interface IProps {
  title: string
  subtitle: string
}

const Title: React.FC<IProps> = (props: IProps) => {
  return (
    <div className="popup-title">
      {props.title}
      <small>{props.subtitle}</small>
    </div>
  )
}

export default Title
