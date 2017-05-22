import qrcode from 'qrcode'

export default {
  MAX_TEXT_LENGTH: 300,
  makeQRCode (text, cb) {
    qrcode.toDataURL(text, {margin: 0}, cb)
  }
  
}

