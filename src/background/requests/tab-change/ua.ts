import { alterHeaders as removeHeaders, toggleWebRequest } from '@/background/utils'
import { ITabEvent, addTabListener, removeTabListener } from '@/background/tabs'
import { convertPattern2Reg } from '@/common/utils'
import { IUaRule, IUaInfo, IRuleConfig, EWebRuleType } from '@/types/web-rule'
import { IWebRequestRules } from '@/types/runtime-webrule'

// cache data for frequently usage
interface ICacheRule {
  reg: RegExp
  ua: string
}

let cachedRules: ICacheRule[] = []

interface ITabCache {
  [k: number]: {
    ua: string
  }
}
const tabCache: ITabCache = {}

// update cache
export async function updateCache (configs: IRuleConfig[]) {
  cachedRules = configs.reduce((acc, cur) => {
    const ua = cur.rules.find(item => item.cmd === EWebRuleType.UA && item.type === 'out') as IUaRule
    if (ua) {
      const reg = cur.useReg ? RegExp(cur.matchUrl) : convertPattern2Reg(cur.url)
      acc.push({
        reg,
        ua: ua.ua
      })
    }
    return acc
  }, [] as ICacheRule[])

  cachedRules.length ? addTabListener(onTabChange) : removeTabListener(onTabChange)
}

function onTabChange (evt: ITabEvent) {
  if (evt.type === 'removed') {
    if (tabCache[evt.tabId]) {
      toggleTabRequest(evt.tabId, false)
      delete tabCache[evt.tabId]
    }
  } else {
    const matched = getMatchedRule(evt.url)
    if (matched) {
      if (!tabCache[evt.tabId]) {
        toggleTabRequest(evt.tabId, true)
      }
      updateTabUa(evt.tabId, matched)
      tabCache[evt.tabId] = matched
    }
  }
}

function getMatchedRule (url: string) {
  return cachedRules.find((rule) => rule.reg.test(url))
}

function updateTabUa (tabId: number, navi: IUaInfo) {
  chrome.tabs.executeScript(
    tabId,
    {
      file: '/content-scripts/change-ua.js',
      // execute js ASAP, make QR feature available even before page loaded
      runAt: 'document_start',
      // change all frame's ua
      allFrames: true
    },
    () => {
      if (chrome.runtime.lastError) {
        return console.warn(chrome.runtime.lastError)
      }
      chrome.tabs.sendMessage(tabId, { cmd: 'update-ua', navi })
    }
  )
}


const webrequests: IWebRequestRules<any> = [
  {
    fn (details) {
      const matched = tabCache[details.tabId]
      if (!matched) return
      const headers = details.requestHeaders || []
      removeHeaders(headers, 'User-Agent')
      headers.push({
        name: 'User-Agent',
        value: matched.ua
      })

      return {
        requestHeaders: headers
      }
    },
    permit: ['requestHeaders', 'blocking'],
    on: 'onBeforeSendHeaders'
  }
]


function getRule (id: number): chrome.webRequest.RequestFilter {
  return {
    tabId: id,
    urls: ['*://*/*']
  }
}

function toggleTabRequest (id: number, isOn?: boolean) {
  toggleWebRequest(webrequests, getRule(id), !!isOn)
}
