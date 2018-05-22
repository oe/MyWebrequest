import qrcode from 'qrcode'

export default {
  MAX_TEXT_LENGTH: 300,
  isMAC: navigator.userAgent.indexOf('Macintosh') > -1,
  makeQRCode (text, size, cb) {
    if (typeof size === 'function') {
      cb = size
      size = 250
    }
    qrcode.toString(text, { type: 'svg', margin: 0 }, (err, str) => {
      if (!err) {
        console.log('svg', str)
        str = 'data:image/svg+xml;base64,' + btoa(str)
      }
      cb(err, str)
    })
  }
}
