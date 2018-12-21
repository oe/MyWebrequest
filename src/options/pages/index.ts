import Requests from './requests'
import ContextMenu from './contextmenu'
import Settings from './settings'
import QrCode from './qrcode'
import Help from './help'

interface IPages {
  [k: string]: any
}
const pages: IPages = {
  Requests,
  ContextMenu,
  Settings,
  QrCode,
  Help
}

export default pages
