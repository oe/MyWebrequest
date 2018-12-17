import { convertPattern2Reg } from '@/common/utils'
import { IRuleConfig, EWebRuleType, IInjectRule } from '@/types/web-rule'
import { ITabEvent, addTabListener, removeTabListener } from '@/background/requests/tab-change/tabs'

// cache data for frequently usage
interface ICacheRule {
  reg: RegExp
  rules: IInjectRule[]
}

let cachedRules: ICacheRule[] = []

// update cache
export async function updateCache (configs: IRuleConfig[]) {
  cachedRules = configs.filter((cfg) => cfg.isValid && cfg.enabled).reduce((acc, cur) => {
    const rules = cur.rules.filter(item => item.cmd === EWebRuleType.INJECT) as IInjectRule[]
    if (rules.length) {
      const reg = cur.useReg ? RegExp(cur.matchUrl) : convertPattern2Reg(cur.url)
      acc.push({
        reg,
        rules
      })
    }
    return acc
  }, [] as ICacheRule[])

  cachedRules.length ? addTabListener(onTabChange) : removeTabListener(onTabChange)
}

function onTabChange (evt: ITabEvent) {
  if (evt.type === 'removed') return
  const matched = getMatchedRule(evt.url)
  if (matched) {
    injectScripts(evt.tabId, matched.rules)
  }
}

function getMatchedRule (url: string) {
  return cachedRules.find((rule) => rule.reg.test(url))
}

function injectScripts (tabId: number, rules: IInjectRule[]) {
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


