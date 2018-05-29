import qrcode from '@/common/qrcode'
const styleText = `
.mwr-qr-mask {
  all: unset;
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
.mwr-qr-mask[is-text] .js-open-url {
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
  margin: 0 auto;
}
.mwr-qr-wrapper .mwr-qr-header {
  line-height: 2;
  font-size: 18px;
  text-align: center;
  color: #333;
}
.mwr-qr-wrapper .mwr-qr-footer {
  line-height: 1.7;
  font-size: 15px;
  text-align: center;
  display: flex;
  justify-content: space-around;
}
.mwr-qr-wrapper .mwr-action-btn {
  all: unset;
  cursor: pointer;
  color: #046af5;
  transition: all .3s;
  text-decoration: none;
}
.mwr-qr-wrapper .mwr-action-btn:hover {
  color: rgba(100, 149, 237, .8);
}
`
const domHtml = `
  <div class="mwr-qr-wrapper">
    <div class="mwr-qr-header">QR Code</div>
    <img class="mwr-qr-img">
    <div class="mwr-qr-footer">
    </div>
  </div>
`
let maskDom
function updateQR () {
  console.log('updateQR')
  chrome.storage.local.get('qr-menu', result => {
    let data = result['qr-menu']
    maskDom[data.type === 'text' ? 'setAttribute' : 'removeAttribute'](
      'is-text',
      ''
    )
    const footer = maskDom.querySelector('.mwr-qr-footer')
    footer.innerHTML = `
    <span class="mwr-action-btn js-copy" title=${JSON.stringify(
    data.content
  )}>${chrome.i18n.getMessage('cs_copy_btn')}</span>
    <a class="mwr-action-btn js-open-url" target="_blank" href="${encodeURI(
    data.content
  )}">${chrome.i18n.getMessage('cs_open_btn')}</a>
    <a class="mwr-action-btn" href="${chrome.runtime.getURL(
    'options/index.html#/qrcode'
  )}" target="_blank">${chrome.i18n.getMessage('cs_more_btn')}</a>
    `
    qrcode.makeQRCode(data.content, 280).then(
      imgStr => {
        maskDom.querySelector('img').setAttribute('src', imgStr)
        maskDom.classList.add('mwr-qr-mask-show')
      },
      e => {
        console.warn(e, e.message)
      }
    )
  })
}

function init () {
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
  maskDom.addEventListener('click', onClickMask)
  document.body.appendChild(maskDom)
  window.updateQR()
}

function onClickMask (e) {
  const target = e.target
  if (target === maskDom) {
    maskDom.classList.remove('mwr-qr-mask-show')
  } else if (
    target.classList.contains('js-copy') &&
    !target.hasAttribute('is-copied')
  ) {
    copyText(target.title, target)
  }
}

function copyText (text, target) {
  const ta = document.createElement('textarea')
  ta.textContent = text
  maskDom.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    target.innerText = chrome.i18n.getMessage('cs_copied_btn')
    target.setAttribute('is-copied', '')
    setTimeout(() => {
      target.innerText = chrome.i18n.getMessage('cs_copy_btn')
      target.removeAttribute('is-copied')
    }, 1000)
  } catch (e) {
    console.log('failed to copy text', e)
  } finally {
    maskDom.removeChild(ta)
  }
}

init()
