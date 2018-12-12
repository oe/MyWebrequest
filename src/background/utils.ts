import debounce from 'lodash.debounce'
import { IWebRequestRules, IRtRule } from '@/types/runtime-webrule'
/**
 * remove headers with names
 * @param  {Array} headers headers
 * @param  {Array|String} names   names to remove
 * @return {Array}
 */
export function alterHeaders (headers: chrome.webRequest.HttpHeader[], names: string | string[], val?: string) {
  let isInNames: Function
  if (Array.isArray(names)) {
    isInNames = (name: string) => names.includes(name)
  } else {
    isInNames = (name: string) => names === name
  }
  let len = headers.length
  while (len--) {
    if (isInNames(headers[len].name)) {
      if (val === undefined) {
        headers.splice(len, 1)
      } else {
        headers[len].value = val
      }
    }
  }
}

interface IItem {
  enabled: boolean
  valid?: boolean
}

/**
 * is a rule valid
 * @param {Object} item rule object
 */
export function isRuleEnabled (item: IItem) {
  return item.enabled && item.valid
}

// force webrequest to reload, make all changes take effects immediately
const forceWebrequestReload = debounce(function () {
  chrome.webRequest.handlerBehaviorChanged()
})

export function toggleWebRequest (webrequests: IWebRequestRules<IRtRule>, rule: chrome.webRequest.RequestFilter, isOn?: boolean) {
  // if (ruleConfig.updateConfig) await ruleConfig.updateConfig(isOn)
  const len = webrequests.length
  for (let i = 0; i < len; i++) {
    const requestConfig = webrequests[i]
    const action = isOn ? 'addListener' : 'removeListener'
    // if (!isOn && requestConfig.cache) requestConfig.cache = null
    // @ts-ignore
    chrome.webRequest[requestConfig.on][action](
      requestConfig.fn,
      rule,
      requestConfig.permit
    )
  }
  forceWebrequestReload()
}


export function diffArray<T> (newIds: T[], oldIds: T[], getRuleIdx: (oldTs: T[], netT: T) => number) {
  const result = {
    added: [] as T[],
    removed: [] as T[]
  }
  // shallow copy to avoid affect the oldIds
  const olds = [...oldIds]
  if (!newIds.length) {
    result.removed = olds
    return result
  }
  if (!olds.length) {
    result.added = newIds
    return result
  }

  newIds.forEach((id) => {
    const idx = getRuleIdx(olds, id)
    if (idx > -1) {
      olds.slice(idx, 1)
    } else {
      result.added.push(id)
    }
  })
  result.removed = oldIds

  return result
}

export function sliceArray<T> (arr: T[], filter: (a: T) => boolean) {
  const idxs: number[] = []
  const result = arr.filter((item, idx) => {
    if (filter(item)) {
      idxs.push(idx)
      return true
    }
    return false
  })
  let len = idxs.length
  while (len--) {
    arr.splice(idxs[len], 1)
  }
  return result
}
