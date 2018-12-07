import qrcode from 'qrcode'

export default {
  MAX_TEXT_LENGTH: 300,
  svg2png (svgStr: string, size: number) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    return new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = reject
      img.src = 'data:image/svg+xml;base64,' + btoa(svgStr)
    })
  },
  makeQRCode (text: string, size?: number) {
    if (typeof size === 'undefined') {
      size = 250
    }
    return new Promise<string>((resolve, reject) => {
      qrcode.toString(text, { type: 'svg', margin: 0 }, (err, str) => {
        if (err) return reject(err)
        resolve('data:image/svg+xml;base64,' + btoa(str))
        // this.svg2png(str, size).then(resolve, reject)
      })
    })
  }
}
