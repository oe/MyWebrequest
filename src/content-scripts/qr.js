import qrcode from '@/common/qrcode'
const template = `
<style>
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
.mwr-qr-wrapper .mwr-qr-content {
  width: 260px;
  height: 260px;
  display: flex;
  margin: 0 auto;
  background: #fff;
  align-items: center;
}
.mwr-qr-wrapper .mwr-qr-img {
  width: 100%;
  height: 100%;
}
.mwr-qr-mask .mwr-qr-error {
  display: none;
  padding: 10px;
  text-align: center;
  font-size: 14px;
}
.mwr-qr-mask.mwr-qr-failed .mwr-qr-error {
  display: block;
}
.mwr-qr-mask.mwr-qr-failed .mwr-qr-img {
  display: none;
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
</style>
<div class="mwr-qr-mask">
<div class="mwr-qr-wrapper">
  <div class="mwr-qr-header">QR Code</div>
  <div class="mwr-qr-content">
    <img class="mwr-qr-img">
    <div class="mwr-qr-error">
      ${chrome.i18n.getMessage('cs_gen_qr_failed')}
    </div>
  </div>
  <div class="mwr-qr-footer">
    <span class="mwr-action-btn js-copy">
    ${chrome.i18n.getMessage('cs_copy_btn')}
    </span>
    <a class="mwr-action-btn js-open-url"
      target="_blank"
      href="javascript:;">
      ${chrome.i18n.getMessage('cs_open_btn')}
    </a>
    <a class="mwr-action-btn"
      href="${chrome.runtime.getURL('options/index.html#/qrcode')}"
      target="_blank">${chrome.i18n.getMessage('cs_more_btn')}</a>
  </div>
</div>
</div>
`

function isURL (url) {
  try {
    /* eslint no-new: "off" */
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}

let maskDom
function updateQR () {
  chrome.storage.local.get('qr-menu', result => {
    let data = result['qr-menu']

    maskDom[isURL(data.content) ? 'removeAttribute' : 'setAttribute'](
      'is-text',
      ''
    )
    const footer = maskDom.querySelector('.mwr-qr-footer')
    footer.querySelector('.js-copy').setAttribute('title', data.content)
    footer
      .querySelector('.js-open-url')
      .setAttribute('href', encodeURI(data.content))
    qrcode.makeQRCode(data.content, 280).then(
      imgStr => {
        maskDom.querySelector('img').setAttribute('src', imgStr)
        maskDom.classList.add('mwr-qr-mask-show')
        maskDom.classList.remove('mwr-qr-failed')
      },
      e => {
        maskDom.classList.add('mwr-qr-mask-show')
        maskDom.classList.add('mwr-qr-failed')
        console.warn('Failed to generate QRCode', e)
      }
    )
  })
}

function main () {
  if (window.__updateQR__) {
    return window.__updateQR__()
  }
  window.__updateQR__ = updateQR
  const div = document.createElement('div')
  div.setAttribute('style', 'all: initial;')
  // prepend div to avoid html is still loading
  document.body.insertBefore(div, document.body.firstChild)
  let shadowRoot
  if (div.attachShadow) {
    shadowRoot = div.attachShadow({ mode: 'closed' })
  } else {
    shadowRoot = div.createShadowRoot()
  }
  shadowRoot.innerHTML = template
  maskDom = shadowRoot.querySelector('.mwr-qr-mask')
  maskDom.addEventListener('click', onClickMask)
  window.__updateQR__()
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
    console.warn('failed to copy text', e)
  } finally {
    maskDom.removeChild(ta)
  }
}

main()
