import debounce from 'lodash.debounce'
import { IRtRequestConfig, IRequestCacheItem } from '@/types/requests'
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

function getChromeMatchUrls (rules: IRtRequestConfig[]) {
  return rules.map(item => item.url)
}

export function toggleWebRequest (requestConfig: IRequestCacheItem) {
  const needToStop = !requestConfig.rules.length
  // noting to do
  if (needToStop && !requestConfig.isOn) return
  if (requestConfig.isOn || !requestConfig.rules.length) {
    // @ts-ignore
    chrome.webRequest[requestConfig.evtName].removeListener(requestConfig.chromeRequestListener)
  }
  // need to start a event
  if (!needToStop) {
    // @ts-ignore
    chrome.webRequest[requestConfig.evtName].addListener(requestConfig.chromeRequestListener, {
      urls: getChromeMatchUrls(requestConfig.rules)
    }, requestConfig.permit)
  }
  requestConfig.isOn = !needToStop
  forceWebrequestReload()
}

export interface IDiffArrayResult<T> {
  added: T[]
  updated: T[]
  removed: T[]
}

/**
 * diff two array, return the diff
 * @param newItems new data items
 * @param oldItems old data tiems
 * @param isEqual is two item totally equal
 * @param isSame (optional) is two item mean to be the same item
 */
export function diffArray<T> (
  newItems: T[],
  oldItems: T[],
  isEqual: (a: T, b: T) => boolean,
  isSame?: (a: T, b: T) => boolean): IDiffArrayResult<T> {
  const result = {
    added: [],
    updated: [],
    removed: []
  } as IDiffArrayResult<T>
  // shallow copy to avoid affect the oldIds
  const olds = [...oldItems]
  if (!newItems.length) {
    result.removed = olds
    return result
  }
  if (!olds.length) {
    result.added = newItems
    return result
  }

  const needTestIsSame = !!isSame
  const findItem = isSame || isEqual
  newItems.forEach((item) => {
    const idx = olds.findIndex(oldItem => findItem(oldItem, item))
    if (idx > -1) {
      if (needTestIsSame) {
        if (!isEqual(olds[idx], item)) {
          result.updated.push(item)
        }
      }
      olds.slice(idx, 1)
    } else {
      result.added.push(item)
    }
  })
  result.removed = olds

  return result
}

export function diffObject<T> (newObj: T, oldObj: T, isEqual?: (a: any, b: any) => boolean) {
  const testEqual = isEqual || ((a: any, b: any) => a === b)
  const result = {
    added: {} as Partial<T>,
    updated: {} as Partial<T>,
    removed: {} as Partial<T>
  }
  const keys = Object.keys(newObj)
  const oldDold = Object.assign({}, oldObj)
  if (!Object.keys(oldDold).length) {
    result.added = newObj
    return result
  }
  keys.forEach(k => {
    if (oldDold.hasOwnProperty(k)) {
      // @ts-ignore
      if (!testEqual(newObj[k], oldDold[k])) {
        // @ts-ignore
        result.updated[k] = newObj[k]
      }
    } else {
      // @ts-ignore
      result.added[k] = newObj[k]
    }
  })
  result.removed = oldDold
  return result
}

export function pickObject<T extends object> (o: T, key: string | string[]): Partial<T> | undefined {
  const keys = Array.isArray(key) ? key : [key]
  const result = keys.reduce((acc, cur) => {
    if (cur in o) {
      // @ts-ignore
      acc[cur] = o[cur]
    }
    return acc
  }, {} as Partial<T>)
  return Object.keys(result).length ? result : undefined
}

/**
 * splice an array by filter, return splice elements
 * @param arr array to process
 * @param filter func
 */
export function spliceArray<T> (arr: T[], filter: (a: T) => boolean) {
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
