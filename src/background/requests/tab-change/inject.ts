import { IDiffArrayResult } from '@/background/requests/utils'
import { convertPattern2Reg } from '@/common/utils'
import { IRequestConfig, EWebRuleType, IInjectRule } from '@/types/requests'
import { ITabEvent, updateTabCache } from './tabs'

// cache data for frequently usage
interface ICacheRule {
  id: string
  reg: RegExp
  rules: IInjectRule[]
}

const cachedRules: ICacheRule[] = []

// update cache
export async function updateCache(diff: IDiffArrayResult<IRequestConfig>) {
  updateTabCache(diff, onTabChange, cachedRules, (acc, cur) => {
    const rules = cur.rules.filter(item => item.cmd === EWebRuleType.INJECT) as IInjectRule[]
    if (rules.length) {
      const reg = cur.useReg ? RegExp(cur.matchUrl) : convertPattern2Reg(cur.url)
      acc.push({
        id: cur.id,
        reg,
        rules
      })
    }
    return acc
  })
}

function onTabChange(evt: ITabEvent) {
  if (evt.type === 'removed') return
  const matched = getMatchedRule(evt.url)
  if (matched) {
    injectScripts(evt.tabId, matched.rules)
  }
}

function getMatchedRule(url: string) {
  return cachedRules.find((rule) => rule.reg.test(url))
}

function injectScripts(tabId: number, rules: IInjectRule[]) {
  rules.forEach(rule => {
    if (rule.type === 'css') {
      chrome.tabs.insertCSS(tabId, rule, () => {
        if (chrome.runtime.lastError) {
          return console.warn('unable to inject css', rule, chrome.runtime.lastError)
        }
      })
    } else {
      chrome.tabs.executeScript(tabId, rule, () => {
        if (chrome.runtime.lastError) {
          return console.warn('unable to inject js', rule, chrome.runtime.lastError)
        }
      })

    }
  })
}


