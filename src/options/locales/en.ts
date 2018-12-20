import { plainify } from '@/common/utils'

const fields = {
  qrcode: {
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
  }
}


export default plainify(fields)