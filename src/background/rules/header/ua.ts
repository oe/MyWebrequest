import { alterHeaders as removeHeaders, diffArray, toggleWebRequest } from '@/background/utils'
// import collection from '@/common/collection'
import { convertPattern2Reg } from '@/common/utils'
import { IUaRule, IUaInfo, IRuleConfig, EWebRuleType } from '@/types/web-rule'
import { IWebRequestRules } from '@/types/runtime-webrule'
import { creatTabCache } from './cache'

// cache data for frequently usage
interface ICacheRule {
  reg: RegExp
  ua: string
}

let cachedRules: ICacheRule[] = []
const UA_TAB_CACHE = creatTabCache({ getTabMatchedRule: getMatchedRule, onTabUpdated, onTabChanged })


// update cache
export async function updateCache (configs: IRuleConfig[]) {
  cachedRules = configs.filter((cfg) => cfg.isValid && cfg.enabled).reduce((acc, cur) => {
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

  // no rules anynore but tab listener is started
  if (UA_TAB_CACHE.isListenerStarted && !cachedRules.length) {
    UA_TAB_CACHE.toggleTabListener(false)
    return
  }
  // has rules but tab listener isn't started yet
  if (!UA_TAB_CACHE.isListenerStarted && cachedRules.length) {
    UA_TAB_CACHE.toggleTabListener(true)
    return
  }
}

function getMatchedRule (tab: chrome.tabs.Tab) {
  const url = tab.url!
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

function onTabUpdated (id: number) {
  const cachedRule = UA_TAB_CACHE.tabCache[id]
  if (!cachedRule) {
    console.warn('can not find cache rule for tab', id)
    return
  }
  updateTabUa(id, cachedRule)
}

const webrequests: IWebRequestRules<any> = [
  {
    fn (details) {
      const matched = UA_TAB_CACHE.tabCache[details.tabId]
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

function getIdIdx (oldIds: number[], id: number) {
  return oldIds.indexOf(id)
}

function onTabChanged (newTabIds: number[], oldTabIds: number[]) {
  const diffs = diffArray(newTabIds, oldTabIds, getIdIdx)
  // @ts-ignore
  diffs.added.forEach(id => toggleWebRequest(webrequests, getRule(id), true))
  // @ts-ignore
  diffs.removed.forEach(id => toggleWebRequest(webrequests, getRule(id), false))
}
