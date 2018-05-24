import qrcode from '@/common/qrcode'
const styleText = `
.mwr-qr-mask {
  opacity: 0;
  display: none;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999999;
  background-color: rgba(0,0,0,.6);
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
}

.mwr-qr-mask textarea {
  display: block;
  position: absolute;
  right: 99999999px;
  opacity: 0;
}

.mwr-qr-mask.mwr-qr-mask-show {
  display: flex;
  opacity: 1;
  transition: opacity .3s;
}
.mwr-qr-mask[is-text] .mwr-qr-open {
  display: none;
}
.mwr-qr-mask .mwr-qr-wrapper {
  position: relative;
  top: -5vh;
  width: 280px;
  min-height: 300px;
  border-radius: 4px;
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
  line-height: 1.7;
  font-size: 15px;
  display: flex;
  justify-content: space-around;
}
.mwr-qr-footer .mwr-qr-copy,
.mwr-qr-footer .mwr-qr-open {
  cursor: pointer;
  color: #046af5;
  transition: all .3s;
  text-decoration: none;
}
.mwr-qr-footer .mwr-qr-copy:hover,
.mwr-qr-footer .mwr-qr-open:hover {
  color: rgba(100, 149, 237, .8);
}
`
const domHtml = `
  <div class="mwr-qr-wrapper">
    <img class="mwr-qr-img">
    <div class="mwr-qr-footer">
    </div>
  </div>
`
let maskDom
function updateQR () {
  console.log('updateQR')
  chrome.storage.local.get('qr-popup', result => {
    let data = result['qr-popup']
    maskDom[data.type === 'text' ? 'setAttribute' : 'removeAttribute'](
      'is-text',
      ''
    )
    const footer = maskDom.querySelector('.mwr-qr-footer')
    footer.innerHTML = `
    <span class="mwr-qr-copy" title=${JSON.stringify(
    data.content
  )}>Copy selected</span>
    <a class="mwr-qr-open" target="_blank" href="${encodeURI(
    data.content
  )}">Open url</a>
    `
    qrcode.makeQRCode(data.content, 280).then(
      imgStr => {
        maskDom.querySelector('img').setAttribute('src', imgStr)
        maskDom.classList.add('mwr-qr-mask-show')
      },
      e => {
        console.log(e)
      }
    )
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
  maskDom.addEventListener('click', onClickMask)
  document.body.appendChild(maskDom)
  window.updateQR()
}

function onClickMask (e) {
  const target = e.target
  if (target === maskDom) {
    maskDom.classList.remove('mwr-qr-mask-show')
  } else if (target.classList.contains('mwr-qr-copy')) {
    copyText(target.title)
  }
}

function copyText (text) {
  const ta = document.createElement('textarea')
  ta.textContent = text
  maskDom.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
  } catch (e) {
    console.log('failed to copy text', e)
  } finally {
    maskDom.removeChild(ta)
  }
}

init()
