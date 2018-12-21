import { alterHeaders as removeHeaders, toggleWebRequest, IDiffArrayResult } from '@/background/requests/utils'
import corsRequest from '../cors'
import { ITabEvent, updateTabCache } from './tabs'
import { convertPattern2Reg } from '@/common/utils'
import { IWebRequestRules, ICorsRule, IRequestConfig, EWebRuleType } from '@/types/requests'

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
    const corsRule = cur.rules[EWebRuleType.CORS_OUT]
    if (corsRule) {
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



function getRule (id: number): chrome.webRequest.RequestFilter {
  return {
    tabId: id,
    urls: ['*://*/*']
  }
}

function toggleTabRequest (id: number, isOn?: boolean) {
  // toggleWebRequest(corsRequest, getRule(id), !!isOn)
}
