import { plainify } from '@/common/utils'

const fields = {
  requests: {
    title: 'Requests',
    subtitle: 'custom all your web requests'
  },
  contextmenu: {
    title: 'ContextMenu',
    subtitle: 'Enhance browser contextmenu'
  },
  settings: {
    title: 'Settings',
    subtitle: 'Custom this extension'
  },
  qrcode: {
    title: 'QRCode',
    subtitle: 'Generate QRCode',
    moreQr: 'Get more data type QRCode...',
    types: {
      text: 'Text',
      vcard: 'Vcard',
      message: 'Message',
      wifi: 'Wifi'
    },
    text: {
      contentPlh: 'text / url / email address / phone number (Extra spaces will be removed)'
    },
    message: {
      telLabel: 'To',
      telPlh: 'e.g. 18800000000',
      contentLabel: 'Message',
      contentPlh: 'Extra spaces will be removed'
    },
    vcard: {
      NLabel: 'Name',
      NPlh: 'e.g. John Smith',
      TELLabel: 'Phone',
      TELPlh: 'e.g. 18800000000',
      EMAILLabel: 'Email',
      EMAILPlh: 'e.g. sir@sample.com',
      URLLabel: 'Home Page',
      URLPlh: 'e.g. http://www.evecalm.com',
      ADRLabel: 'Address',
      ADRPlh: 'e.g. NewTon Avu, NYC',
      NOTELabel: 'Meno',
      NOTEPlh: 'e.g. The guy in blue T-shirt',
    },
    wifi: {
      SLabel: 'Wifi Name',
      SPlh: 'e.g. Daddy Shop',
      TLabel: 'Encryption',
      TPlh: 'Choose a encryption method',
      TOptionNopassLabel: 'No encryption',
      TOptionWEPLabel: 'WEP',
      TOptionWPALabel: 'WPA/WPA2',
      PLabel: 'Password',
      PPlh: 'e.g. xxxxxx'
    }
  },
  help: {
    title: 'Help',
    subtitle: 'Some useful information'
  }
}


export default plainify(fields)