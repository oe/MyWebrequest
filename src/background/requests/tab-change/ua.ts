import { alterHeaders as removeHeaders, toggleWebRequest, IDiffArrayResult } from '@/background/requests/utils'

import { ITabEvent, updateTabCache } from './tabs'
import { convertPattern2Reg } from '@/common/utils'
import { IWebRequestRules, IUaInfo, IRequestConfig, EWebRuleType } from '@/types/requests'

// cache data for frequently usage
interface ICacheRule {
  id: string
  reg: RegExp
  ua: string
}

const cachedRules: ICacheRule[] = []

interface ITabCache {
  [k: number]: {
    ua: string
  }
}
const tabCache: ITabCache = {}

// update cache
export async function updateCache (diff: IDiffArrayResult<IRequestConfig>) {
  updateTabCache(diff, onTabChange, cachedRules, (acc, cur) => {
    const ua = cur.rules[EWebRuleType.UA_OUT]
    if (ua) {
      const reg = cur.useReg ? RegExp(cur.matchUrl) : convertPattern2Reg(cur.url)
      acc.push({
        id: cur.id,
        reg,
        ua: ua.ua
      })
    }
    return acc
  })
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
      const matched = tabCache[details.tabId || -1]
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
  // toggleWebRequest(webrequests, getRule(id), !!isOn)
}
