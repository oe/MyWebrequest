function changeUaInfo (navi) {
  Object.defineProperties(navigator, 'userAgent', {
    get () {
      return navi.ua
    }
  })
}

function main () {
  if (window.__is_ua_inited__) {
    return
  }
  window.__is_ua_inited__ = true
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.cmd === 'update-ua') {
      changeUaInfo(request.navi)
    }
  })
}

main()
