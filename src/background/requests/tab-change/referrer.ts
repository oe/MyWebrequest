import { IDiffArrayResult } from '@/background/utils'
import { convertPattern2Reg } from '@/common/utils'
import { IRequestConfig, EWebRuleType } from '@/types/requests'
import { ITabEvent, updateTabCache } from './tabs'

// cache data for frequently usage
interface ICacheRule {
  id: string
  reg: RegExp
}

const cachedRules: ICacheRule[] = []

// update cache
export async function updateCache (diff: IDiffArrayResult<IRequestConfig>) {
  updateTabCache(diff, onTabChange, cachedRules, (acc, cur) => {
    const referrer = cur.rules.find(item => item.cmd === EWebRuleType.REFERRER && item.type === 'out')
    if (referrer) {
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


