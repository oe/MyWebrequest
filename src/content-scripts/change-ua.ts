import { IUaInfo } from '@/types/web-rule'
function changeUaInfo (navi: IUaInfo) {
  // change ua for content script env
  Object.defineProperties(navigator, {
    userAgent: {
      get () {
        return navi.ua
      }
    }
  })

  // change ua for normal browser env
  const code = `
  Object.defineProperties(navigator, {
    userAgent: {
      get () {
        return '${navi.ua}'
      }
    }
  })
  `
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.innerText = code
  document.documentElement!.insertBefore(
    script,
    document.documentElement!.firstChild
  )
}

function main () {
  // @ts-ignore
  if (window.__is_ua_inited__) {
    return
  }
  // @ts-ignore
  window.__is_ua_inited__ = true
  chrome.runtime.onMessage.addListener(request => {
    if (request.cmd === 'update-ua') {
      changeUaInfo(request.navi)
    }
  })
}

main()
