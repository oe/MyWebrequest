import qrcode from '@/common/qrcode'
const styleText = `
.mwr-qr-mask {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 102400;
  background-color: rgba(0,0,0,.6);
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
}
.mwr-qr-mask .mwr-qr-wrapper {
  width: 280px;
  min-height: 300px;
  border-radius: 6px;
  background-color: whitesmoke;
  box-shadow: 0 0 0 -4px #ccc;
}
.mwr-qr-wrapper .mwr-qr-img {
  width: 260px;
  height: 260px;
  display: block;
  margin: 10px auto 0;
}
.mwr-qr-wrapper .mwr-qr-footer {
  color: blue;
  line-height: 1.7;
  font-size: 18px;
  text-align: center;
}
`
const domHtml = `
  <div class="mwr-qr-wrapper">
    <img class="mwr-qr-img">
    <div class="mwr-qr-footer">xxxxx</div>
  </div>
`
let maskDom
function updateQR () {
  console.log('updateQR')
  chrome.storage.local.get('qr-popup', result => {
    let data = result['qr-popup']
    qrcode.makeQRCode(data.content, (err, src) => {
      if (err) {
        console.log(err)
        return
      }
      maskDom.querySelector('img').setAttribute('src', src)
      maskDom.setAttribute('style', '')
    })
  })
}

function init () {
  console.log('init scripts')
  if (window.updateQR) {
    return window.updateQR()
  }
  window.updateQR = updateQR
  const style = document.createElement('style')
  style.textContent = styleText
  document.head.appendChild(style)
  maskDom = document.createElement('div')
  maskDom.classList.add('mwr-qr-mask')
  maskDom.innerHTML = domHtml
  console.log('init dom')
  maskDom.addEventListener('click', e => {
    if (e.target !== maskDom) return
    maskDom.setAttribute('style', 'display: none;')
  })
  document.body.appendChild(maskDom)
  window.updateQR()
}

init()
