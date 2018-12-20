import qs from 'qs'
import i18nMod from './i18n'

const escapeRegExp = /[-[\]+?.,/\\^$|#\s]/g

interface IKeyVal {
  [k: string]: string
}

interface INotifyCbs {
  [k: string]: Function
}
// const arrType = ['block', 'hsts', 'hotlink', 'log', 'custom']
const notifyCbs: INotifyCbs = {}
let notifyIndex = 0
chrome.notifications.onClicked.addListener(function (nId) {
  notifyCbs[nId] && notifyCbs[nId]()
})
chrome.notifications.onClosed.addListener(function (nId) {
  delete notifyCbs[nId]
})

interface INotification {
  id?: string
  title: string
  content: string
  onclick?: Function
  timeout?: number
}


export function pushNotification ({ id, title, content, onclick, timeout }: INotification) {
  const notifyId = id || `${notifyIndex++}`
  chrome.notifications.create(notifyId, {
    type: 'basic',
    iconUrl: '/static/icons/icon38.png',
    title: title,
    message: content
  })
  if (onclick instanceof Function) {
    notifyCbs[notifyId] = onclick
  }
  if (timeout) {
    setTimeout(() => {
      chrome.notifications.clear(notifyId)
    }, timeout)
  }
}
/**
 * convert chrome url match pattern to reg
 * @param pattern string
 */
export function convertPattern2Reg (pattern: string) {
  const reg = pattern.replace(escapeRegExp, '\\$&').replace(/\*/g, '.*')
  return RegExp('^' + reg + '$')
}
/** is url match the chrome url match pattern */
export function isURLMatchPattern (url: string, pattern: string | RegExp) {
  if (typeof pattern === 'string') pattern = convertPattern2Reg(pattern)
  return pattern.test(url)
}
/** get guid */
export function guid () {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return (
    s4() +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    '-' +
    s4() +
    s4() +
    s4()
  )
}

/** reg to match [protocol, host, path, query] */
export const urlComponentReg = /^([^:]+):\/\/([^/]+)(\/[^?]*)(\?(.*))?$/
/** rule types */
export const RULE_TYPES = [
  'requests',
  // 'ua'
  // 'contextmenu'
]
/** unique array */
export function uniqueArray<T> (arr: T[]) {
  return arr.filter((item, idx) => arr.indexOf(item) === idx)
}

/** parse querystring to object */
export const parseQs = qs.parse
/**
 * is url1 cross domain of url2
 */
export function isXDomain (url1: string, url2: string) {
  if (!url1) return false
  // origins not the same
  return (
    url1.replace(/(?<=(\w))\/.*$/, '') !== url2.replace(/(?<=(\w))\/.*$/, '')
  )
}

/**
 * get qs from url, return '' if no querystring found
 */
export function getQs (url: string) {
  // no query string, return ''
  if (!/.+\?/.test(url)) return ''
  return url.replace(/(#[^#]*)?$/, '').replace(/^([^?]*\?)?/, '')
}

export const i18n = i18nMod.internationalize

/**
 * is type a valid rule type
 * @return {Boolean}      [description]
 */
export function isUrlRuleType (type: string) {
  return RULE_TYPES.indexOf(type) !== -1
}

/**
 * preprocess a router when use
 */
export function preprocessRouter (router: any) {
  delete router.createdAt
  delete router.updatedAt
  if (!router.noParams) {
    router.reg = RegExp(router.reg)
    if (router.hasWdCd && router.wdCdReg) {
      router.wdCdReg = RegExp(router.wdCdReg)
    }
  }
  return router
}
/**
 * get target url for custom rule
 * @param  {Object} router   url pattern to match a url
 * @param  {String} url     a real url that match route
 * @return {String}         converted url
 */
export function getTargetUrl (router: any, url: string) {
  console.log('getTargetUrl, router: %o, url: %s', router, url)
  // if no params in redirect url, then use redirect url as result
  if (router.noParams) return router.redirectUrl

  const params = getUrlValues(router, url)
  console.log('params in url: %o', params)
  if (!params) {
    return ''
  }
  return fillPattern(router.redirectUrl, params)
}
/**
 * get a key-value object from the url which match the pattern
 * @param  {Object} r   {reg: ..., params: ''} from getRouter
 * @param  {String} url a real url that match that pattern
 * @return {Object}
 */
export function getUrlValues (r: any, url: string) {
  let matches: null | string[]
  const res: IKeyVal = {}
  try {
    matches = r.reg.exec(url)
  } catch (e) {
    matches = null
  }
  if (!matches) {
    return null
  }
  let v: string
  // get path values
  for (let k = 0; k < r.params.length; k++) {
    v = r.params[k]
    res[v] = matches[k + 1] || ''
  }

  if (r.useReg) {
    res['$0'] = url
  }

  // get query string values
  if (r.hasQs) {
    const qsParams = parseQs(getQs(url))

    for (const k of Object.keys(r.qsParams || {})) {
      v = r.qsParams[k]
      res[v] = qsParams[k] || ''
    }
  }

  urlComponentReg.exec(url)
  // keep protocol
  res.p = RegExp.$1
  // keep host
  res.h = RegExp.$2
  // main domain
  res.m = res.h
    .split('.')
    .slice(-2)
    .join('.')
  // path, without the prefix /
  res.r = RegExp.$3.replace(/^\//, '')
  // query string without question mark
  res.q = RegExp.$5
  // the whole url
  res.u = url
  // get wildcard vars
  if (r.hasWdCd && r.wdCdReg) {
    res.__wildcard = url.replace(r.wdCdReg, '')
  }
  return res
}

// fill a custom url redirect rule with data
export function fillPattern (pattern: string, data: IKeyVal) {
  pattern = pattern.replace(
    /(?<=[?|&])([^=]+)=\{([^}]+)\}/g,
    ($0, $1, $2) => {
      // tslint:disable-next-line
      const val = data[$2] != null ? data[$2] : ''
      return toQueryString($1, val)
    }
  )
  let url = pattern.replace(/\{([^}]+)\}/g, function ($0, $1) {
    // tslint:disable-next-line
    const val = data[$1] != null ? data[$1] : ''
    // encodeURI instead of encodeURIComponent
    return encodeURI(val)
  })
  if (data.__wildcard) {
    url = url.replace(/\*$/, data.__wildcard)
  }
  // final url may not be a valid url
  return url.replace(/\?$/, '')
}

/**
 * convert key-val into an querysting: encode(key)=encode(val)
 * if val is an array, there will be an auto conversion
 * @param  {String} key
 * @param  {String|Array} val
 * @return {String}
 */
export function toQueryString (key: string, val: any) {
  if (Array.isArray(val)) {
    try {
      key = decodeURIComponent(key)
      key = key.replace(/\[\]$/, '') + '[]'
      key = encodeURIComponent(key).replace('%20', '+')
    } catch (e) { /** */ }
    return (
      `${key}` +
      val
        .map(el => encodeURIComponent(el).replace('%20', '+'))
        .join(`&${key}=`)
    )
  } else {
    val = encodeURIComponent(val).replace('%20', '+')
    return `${key}=${val}`
  }
}

export interface IPlainify {
  [k: string]: string
}

export function plainify (o: object, result = {} as IPlainify, prefix = '') {
  Object.keys(o).reduce((acc, k) => {
    // @ts-ignore
    const val = o[k]
    const p = prefix ? `${prefix}.${k}` : k
    if (val && typeof val === 'object') {
      return plainify(val, result, p)
    }
    // @ts-ignore
    acc[p] = val
    return acc
  }, result)
  return result
}