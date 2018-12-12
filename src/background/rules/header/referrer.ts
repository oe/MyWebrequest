import { convertPattern2Reg } from '@/common/utils'
import { IRuleConfig, EWebRuleType } from '@/types/web-rule'
import { creatTabCache } from './cache'

// cache data for frequently usage
interface ICacheRule {
  reg: RegExp
}

let cachedRules: ICacheRule[] = []
const UA_TAB_CACHE = creatTabCache({ getTabMatchedRule: getMatchedRule, onTabUpdated })


// update cache
export async function updateCache (configs: IRuleConfig[]) {
  cachedRules = configs.filter((cfg) => cfg.isValid && cfg.enabled).reduce((acc, cur) => {
    const ua = cur.rules.find(item => item.cmd === EWebRuleType.REFERRER && item.type === 'out')
    if (ua) {
      const reg = cur.useReg ? RegExp(cur.matchUrl) : convertPattern2Reg(cur.url)
      acc.push({
        reg
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


function removeReferrer (tabId: number) {
  chrome.tabs.executeScript(
    tabId,
    {
      file: '/content-scripts/remove-referrer.js',
      // execute js ASAP, make QR feature available even before page loaded
      runAt: 'document_start',
      // change all frame's referrer
      allFrames: true
    },
    () => {
      if (chrome.runtime.lastError) {
        return console.warn(chrome.runtime.lastError)
      }
    }
  )
}

function onTabUpdated (id: number) {
  const cachedRule = UA_TAB_CACHE.tabCache[id]
  if (!cachedRule) {
    console.warn('can not find cache rule for tab', id)
    return
  }
  removeReferrer(id)
}

