import { alterHeaders as removeHeaders, toggleWebRequest, IDiffArrayResult } from '@/background/utils'
import corsRequest from '../cors'
import { ITabEvent, updateTabCache } from './tabs'
import { convertPattern2Reg } from '@/common/utils'
import { IWebRequestRules, IUaRule, IRequestConfig, EWebRuleType } from '@/types/requests'

// cache data for frequently usage
interface ICacheRule {
  id: string
  reg: RegExp
}

const cachedRules: ICacheRule[] = []

interface ITabCache {
  [k: number]: true
}
const tabCache: ITabCache = {}

// update cache
export async function updateCache (diff: IDiffArrayResult<IRequestConfig>) {
  updateTabCache(diff, onTabChange, cachedRules, (acc, cur) => {
    const ua = cur.rules.find(item => item.cmd === EWebRuleType.CORS && item.type === 'out') as IUaRule
    if (ua) {
      const reg = cur.useReg ? RegExp(cur.matchUrl) : convertPattern2Reg(cur.url)
      acc.push({
        id: cur.id,
        reg
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
    const matched = isMatch(evt.url)
    if (matched) {
      if (!tabCache[evt.tabId]) {
        toggleTabRequest(evt.tabId, true)
      }
      tabCache[evt.tabId] = true
    }
  }
}

function isMatch (url: string) {
  return cachedRules.some((rule) => rule.reg.test(url))
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
        value: 'xxxx'
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
