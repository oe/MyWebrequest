import { convertPattern2Reg } from '@/common/utils'
import { IRuleConfig, EWebRuleType } from '@/types/web-rule'
import { ITabEvent, addTabListener, removeTabListener } from '@/background/tabs'

// cache data for frequently usage
interface ICacheRule {
  reg: RegExp
}

let cachedRules: ICacheRule[] = []

// update cache
export async function updateCache (configs: IRuleConfig[]) {
  cachedRules = configs.reduce((acc, cur) => {
    const referrer = cur.rules.find(item => item.cmd === EWebRuleType.REFERRER && item.type === 'out')
    if (referrer) {
      const reg = cur.useReg ? RegExp(cur.matchUrl) : convertPattern2Reg(cur.url)
      acc.push({
        reg
      })
    }
    return acc
  }, [] as ICacheRule[])

  cachedRules.length ? addTabListener(onTabChange) : removeTabListener(onTabChange)
}

function onTabChange (evt: ITabEvent) {
  if (evt.type === 'removed') return
  if (isUrlMatch(evt.url)) {
    removeReferrer(evt.tabId)
  }
}

function isUrlMatch (url: string) {
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


