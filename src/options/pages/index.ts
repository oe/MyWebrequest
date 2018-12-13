import React, { Component } from 'react'
import Requests from './requests'
import ContextMenu from './contextmenu'
import Settings from './settings'
import Help from './help'

interface IPages {
  [k: string]: any
}
const pages: IPages = {
  Requests,
  ContextMenu,
  Settings,
  Help
}

export default pages
