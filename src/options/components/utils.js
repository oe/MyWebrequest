/**
 * is string a supported protocol
 * @param  {String}  protocol
 * @return {Boolean}
 */
// all supported protocols
const protocols = ['*', 'https', 'http']
function isProtocol (protocol) {
  return protocols.indexOf(protocol) !== -1
}

// reg to match protocol, host, path, query
const urlComponentReg = /^(\*|\w+):\/\/([^/]+)\/([^?]*)(\?(.*))?$/
/**
 * is string a valid host
 *   use native object URL to test
 * @param  {String}  host
 * @return {Boolean}
 */
function isHost (host) {
  try {
    const u = new URL(`http://${host}`)
    return u.host === host
  } catch (e) {
    return false
  }
}

/**
 * is string a valid IP address
 *   simplify judgement, performance may low
 * @param  {String}  ip
 * @return {Boolean}
 */
function isIP (ip) {
  if (isHost(ip)) {
    const pts = ip.split('.')
    return pts.length === 4 && /^\d+$/.test(pts.join(''))
  } else {
    return false
  }
}

/**
 * check a path. eg. path/subpath/file.html?querystring
 * @param  {String}  path      path, without leading '/'
 * @param  {Boolean}  withoutQS is path without qs
 * @return {Boolean}
 */
function isPath (path, withoutQS) {
  const url = `http://evecalm.com/${path}`
  const u = parseURL(url)
  if (!u) return false
  let targetStr = u.pathname
  if (!withoutQS) targetStr += u.search
  return '/' + path === targetStr
}

function isURL (url) {
  try {
    const u = new URL(url)
    return isProtocol(u.protocol)
  } catch (e) {
    return false
  }
}

/**
 * get object's values into an array
 * @param  {Object} o
 * @return {Array}
 */
const getObjVals = (function () {
  if (Object.values) {
    return function (o) {
      return Object.values(o || {})
    }
  } else {
    return function (o) {
      o = o || {}
      return Object.keys(o).map(k => o[k])
    }
  }
})()

// return true if valid or a error object
function isValidReg (reg) {
  try {
    /* eslint no-new: "off" */
    new RegExp(reg)
    return true
  } catch (e) {
    return e
  }
}

/**
 * GET url info url the clipboard, returns {protocol, host, path, search}
 * @param  {Event} e  paste event
 * @return {Object}
 */
function parseURL (url) {
  if (!url) return
  try {
    return new URL(url)
  } catch (e) {
    console.error('invalid url in clipboard', url, e)
  }
}

/**
 * is rule coverring subRule
 * like: *://*.g.com covers http://ad.g.com or http://*.g.com
 * exmaple: to detect if a custom rule is conflicted with a block rule
 */
function isSubRule (rule, subRule) {
  let matches = urlComponentReg.exec(rule)
  let prtl1 = matches[1]
  let url1 = matches[2] + matches[3]

  matches = urlComponentReg.exec(subRule)
  let prtl2 = matches[1]
  let url2 = matches[2] + matches[3]
  if (prtl1 !== '*' && prtl1 !== prtl2) {
    return false
  }

  url1 = url1.replace(escapeRegExp, '(?:\\$&)').replace(/\*/g, '.*')
  url1 = `^${url1}$`
  return new RegExp(url1).test(url2)
}

// 获取URL的queryString
function getQs (url) {
  url = `${url}`.replace(/#[^#]*$/, '')
  const matches = url.match(/\?(.*)$/)
  return matches ? matches[1] : ''
}

/**
 * parse a query string into a key-value object
 * @param  {String} qs
 * @return {Object}
 */
function parseQs (qs) {
  const params = {}
  let canDecode = true
  qs.split('&').forEach(function (el) {
    let parts = el.split('=')
    let k = parts[0]
    let v = parts[1] != null ? parts[1] : ''
    if (canDecode) {
      try {
        k = decodeURIComponent(k)
        v = decodeURIComponent(v)
      } catch (e) {
        canDecode = false
      }
    }
    // combine array query param into an real array
    if (params[k] != null) {
      if (!Array.isArray(params[k])) {
        params[k] = [params[k]]
      }
      return params[k].push(v)
    } else {
      return (params[k] = v)
    }
  })

  return params
}

/**
 * convert key-val into an querysting: encode(key)=encode(val)
 * if val is an array, there will be an auto conversion
 * @param  {String} key
 * @param  {String|Array} val
 * @return {String}
 */
function toQueryString (key, val) {
  if (Array.isArray(val)) {
    try {
      key = decodeURIComponent(key)
      key = key.replace(/\[\]$/, '') + '[]'
      key = encodeURIComponent(key).replace('%20', '+')
    } catch (e) {}
    return (
      `${key}` +
      val.map(el => encodeURIComponent(el).replace('%20', '+')).join(`&${key}=`)
    )
  } else {
    val = encodeURIComponent(val).replace('%20', '+')
    return `${key}=${val}`
  }
}

// get keywords list(array) in route object
let getKwdsInRoute = router =>
  [].concat(router.params, RESERVED_HOLDERS, getObjVals(router.qsParams))

/**
 * is route string valid
 * return false if invalid
 * validate string like {abc}.user.com/{hous}/d.html?hah
 * @param  {String}  route
 * @return {Boolean}
 */
let isRouterStrValid = function (route) {
  // if the route doesnt has path and query string
  // like http://g.cn
  // then add a / in the end
  if (!/\w\//.test(route)) {
    route += '/'
  }
  let matches = urlComponentReg.exec(route)
  if (!matches) {
    return false
  }

  // let protocol = matches[1]
  // path is host + real path
  let path = matches[2] + '/' + matches[3]
  // query string without prefix ?
  let qs = matches[5]

  // path basic format
  if (
    !/^(\{\w+\}\.)*(\w+\.)+\w+\/(\{\w+\}|[a-z0-9-_+=&%@!.,*?|~/])*(\{\*\w+\})?$/.test(
      path
    )
  ) {
    return false
  }
  // {*named} should only used in the end of the path
  if (/(\{\*\w+\}).+$/.test(path)) {
    return false
  }
  if (qs) {
    // query string basic format
    if (
      !/^(([\w_+%@!.,*?|~/]+=\{\w+\})|([\w_+%@!.,*?|~/]+=[\w_+%@!.,*?|~/]+)|&)*$/.test(
        qs
      )
    ) {
      return false
    }
    // /\{\*\w+\}/  for {*named}, not allowed
    // /[?&]\{\w+\}/ or ?{named} or &{named}, not allowd
    // /\{\w+\}(?!&|$)/ for letter followed not & or eof
    if (
      /\{\*\w+\}/.test(qs) ||
      /[?&]\{\w+\}/.test(qs) ||
      /\{\w+\}(?!&|$)/.test(qs)
    ) {
      return false
    }
  }

  let n = route.replace(/\{\*?\w+\}/g, 'xxx')
  return isURL(n)
}

// // http://www.baidu.com/{g}-{d}/{*abc}?abc={name}&youse={bcsd}
// // http://www.baidu.com/{g}-{d}/{*abc}?abc={name}&youse={bcsd}
// optionalParam = /\((.*?)\)/g
let namedParam = /\{(\(\?)?(\w+)\}/g
let splatParam = /\{\*(\w+)\}/g
// escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g
var escapeRegExp = /[-[\]+?.,\\^$|#\s]/g
let queryStrReg = /([\w_+%@!.,*?|~/]+)=\{(\w+)\}/g
/**
 * convert a url pattern to a regexp
 * @param  {String} route url match pattern
 * @param  {String} redirectUrl url redirect pattern
 * @return {Object}
 *                 {
 *                    url: match url, which url will be captured used by chrome
 *                    reg: regexp string can match an url & extract params
 *                    matchUrl: source rule, aka the in-param route
 *                    hasQs: has named params in query string
 *                    params: two array of var name of each named param in path an querystring
 *                 }
 */
let getRouter = function (route, redirectUrl) {
  let result = {
    matchUrl: route,
    redirectUrl
  }

  // if the route doesnt has path and query string
  // like http://g.cn
  // then add a / in the end
  if (!/\w\//.test(route)) {
    route += '/'
  }
  let protocol = route.match(/^([\w*]+):\/\//)

  protocol = protocol ? protocol[1] : '*'
  let url = protocol + '://'

  if (protocol === '*') {
    protocol = '\\w+'
  }
  // remove protocol
  route = route.replace(/^([\w*]+):\/\//, '')

  // replace query string with *
  url += route
    .replace(/\?.*$/, '*')
    // replace named holder with * in host
    .replace(/^[^/]*(\.|\{\w+\}|\w+)*\.{\w+\}/, '*')
    // replace named holder with * in path
    .replace(/\{\*?\w+\}.*$/, '*')
  // add a asterisk to disable strict match
  result.url = url.replace(/\*+$/, '') + '*'

  let parts = route.split('?')
  // route contains more than one ?
  if (parts.length > 2) {
    return result
  }
  result.hasQs = parts.length === 2
  let params = []

  // hand named params in path
  let part = parts[0]
    .replace(escapeRegExp, '\\$&')
    // .replace optionalParam, '(?:$1)?'
    .replace(namedParam, function (match, $1, $2) {
      params.push($2)
      if ($1) {
        return match
      } else {
        return '([^/?]+)'
      }
    })
    .replace(splatParam, function (match, $1) {
      params.push($1)
      return '([^?]*)'
    })
  let reg = `^${protocol}:\\/\\/${part}(?:\\?(.*))?`
  result.reg = reg
  result.params = params

  // hand named params in query string
  params = {}
  if (result.hasQs) {
    parts[1].replace(queryStrReg, function ($0, $1, $2) {
      try {
        $1 = decodeURIComponent($1)
      } catch (e) {}
      return (params[$1] = $2)
    })
  }
  result.qsParams = params
  result.hasQs = !!Object.keys(params).length

  return result
}

// pre-defined placeholders
var RESERVED_HOLDERS = ['p', 'h', 'm', 'r', 'q', 'u']
// have reserved word in url pattern
// return a reserved words list that has been miss used.
let hasReservedWord = function (router) {
  let params = getKwdsInRoute(router)
  let res = []
  for (let v of Array.from(RESERVED_HOLDERS)) {
    if (
      Array.from(params).includes(v) ||
      Array.from(params).includes(`%${v}`) ||
      Array.from(params).includes(`=${v}`)
    ) {
      res.push(v)
    }
  }
  // remove duplicated names
  res = res.filter((v, k) => k !== res.indexOf(v))
  if (res.length) {
    return res
  }
}

/**
 * check the whether router's keywords are unique
 * return undefined if valid
 * return an array of duplicated names if found in params
 * @param  {Object}  res result returned by getRouter
 * @return {Boolean|Array|undefined}
 */
function isKwdsUniq (router) {
  const params = getKwdsInRoute(router)
  // find duplicated
  const res = params.filter((v, k) => k !== params.indexOf(v))
  return !res.length
}

// get a list from redirect to url, eg. http://{sub}.github.com/{name}/{protol}
// %name mean encodeURIComponent name
// =name mean decodeURIComponent name
let getRedirectParamList = function (url) {
  let matches = url.match(/\{(\w+)\}/g) || []
  return matches.map(v => v.slice(1, -1))
}

/**
 * redirect rule valid
 * @param  {String}  redirectUrl
 * @return {Boolean}
 */
let isRedirectRuleValid = function (redirectUrl) {
  // redirectUrl is empty
  if (!redirectUrl) {
    return false
  }
  // no params found in redirect url
  if (!getRedirectParamList(redirectUrl).length) {
    return false
  }
  // remove param placeholder and check the url
  // comment out this, the result url should be valid
  // isURL redirectUrl.replace(/^\{\w+\}/, '*').replace /^\{\w+\}/g, 'xxx'
  return true
}

/**
 * return undefined if no undefined word, or a list contains undefined words
 * @param  {Object}  router a defined word list
 * @param  {String}  url   a url pattern that use words in refer
 * @return {Array|undefined}
 */
function hasUndefinedWord (router, url) {
  const params = getKwdsInRoute(router)
  const sample = getRedirectParamList(url)
  return sample.some(k => {
    return params.indexOf(k) === -1
  })
}

/**
 * get a key-value object from the url which match the pattern
 * @param  {Object} r   {reg: ..., params: ''} from getRouter
 * @param  {String} url a real url that match that pattern
 * @return {Object}
 */
let getUrlValues = function (r, url) {
  let k, matches, v
  let res = {}
  try {
    matches = new RegExp(r.reg).exec(url)
  } catch (e) {
    matches = ''
  }
  if (!matches) {
    return null
  }
  // get path values
  for (k = 0; k < r.params.length; k++) {
    v = r.params[k]
    res[v] = matches[k + 1] || ''
  }

  // get query string values
  if (r.hasQs) {
    let qsParams = parseQs(getQs(url))

    for (k of Object.keys(r.qsParams || {})) {
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
  res.r = RegExp.$3
  // query string without question mark
  res.q = RegExp.$5
  // the whole url
  res.u = url
  return res
}

// fill a pattern with data
function fillPattern (pattern, data) {
  pattern = pattern.replace(/([\w%+[\]]+)=\{(\w+)\}/g, function ($0, $1, $2) {
    let val = data[$2] != null ? data[$2] : ''
    return toQueryString($1, val)
  })

  let url = pattern.replace(/\{(\w+)\}/g, function ($0, $1) {
    let val = data[$1] != null ? data[$1] : ''
    // / in val, like abc/bdc, won't be encoded
    //   q is query string, do not encode query string again
    //   u is url, encoded anywhere
    if (($1 !== 'u' && ~val.indexOf('/')) || $1 === 'q') {
      return val
    } else {
      return encodeURIComponent(val)
    }
  })
  return url.replace(/\?$/, '')
}

/**
 * get target url
 * @param  {Object} router   url pattern to match a url
 * @param  {String} url     a real url that match route
 * @return {String}         converted url
 */
function getTargetUrl (router, url) {
  console.log('getTargetUrl, router: %o, url: %s', router, url)
  let params = getUrlValues(router, url)
  console.log('params in url: %o', params)
  if (!params) {
    return ''
  }
  return fillPattern(router.redirectUrl, params)
}

/**
 * debounce
 * @param  {Function} fn      [description]
 * @param  {Object}   context [description]
 * @param  {Number}   wait    [description]
 * @return {Function}
 */
function debounce (fn, wait) {
  let tid = null
  let result
  if (isNaN(wait) || wait < 0) wait = 200

  return function debounced (...args) {
    clearTimeout(tid)
    tid = setTimeout(() => {
      result = fn.apply(this, args)
    }, wait)
    return result
  }
}

export default {
  isProtocol,
  isIP,
  isHost,
  isPath,
  isURL,
  isSubRule,
  getQs,
  parseQs,
  debounce,
  isRouterStrValid,
  getRouter,
  getUrlValues,
  isValidReg,
  isRedirectRuleValid,
  hasUndefinedWord,
  isKwdsUniq,
  hasReservedWord,
  getTargetUrl,
  parseURL
}
