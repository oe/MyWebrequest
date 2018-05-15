import cutils from '../../common/utils'

window.cutils = cutils
// get a UUID
function guid () {
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

/**
 * is string a supported protocol
 * @param  {String}  protocol
 * @return {Boolean}
 */
// all supported protocols
const protocols = ['*', 'https', 'http']
// pre-defined placeholders
const RESERVED_HOLDERS = ['p', 'h', 'm', 'r', 'q', 'u']

function isProtocol (protocol) {
  return protocols.indexOf(protocol) !== -1
}

// reg to match [protocol, host, path, query]
// const urlComponentReg = /^(\*|\w+):\/\/([^/]+)\/([^?]*)(\?(.*))?$/

/**
 * parse url by reg
 *   difference from parseURL: (url) may be invalid url but a valid rule
 * @param  {String} url string
 * @return {Array}
 */
function getURLParts (url) {
  return url.match(cutils.urlComponentReg)
}
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

/**
 * is string a valid https? url
 * @param  {String}  url
 * @return {Boolean}
 */
function isURL (url) {
  try {
    const u = new URL(url)
    // some invalid http url has empty host, & contains no special chars
    return (
      u.host &&
      isProtocol(u.protocol.replace(/:$/, '')) &&
      encodeURI(url) === url
    )
  } catch (e) {
    return false
  }
}

/**
 * is string a valid reg
 * @param  {String}  reg
 * @return {Boolean}
 */
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
 * parse a url string returns {protocol, host, path, search}
 *   use native URL to parse
 * @param  {String} url
 * @return {Object}
 */
function parseURL (url) {
  try {
    return new URL(url)
  } catch (e) {
    console.error('invalid url in clipboard', url, e)
    return false
  }
}

/**
 * is rule coverring subRule
 * like: *://*.g.com covers http://ad.g.com or http://*.g.com
 * exmaple: to detect if a custom rule is conflicted with a block rule
 */
function isSubRule (rule, subRule) {
  let matches = cutils.urlComponentReg.exec(rule)
  let prtl1 = matches[1]
  let url1 = matches[2] + '/' + matches[3]

  matches = cutils.urlComponentReg.exec(subRule)
  let prtl2 = matches[1]
  let url2 = matches[2] + '/' + matches[3]
  if (prtl1 !== '*' && prtl1 !== prtl2) {
    return false
  }

  url1 = url1.replace(escapeRegExp, '(?:\\$&)').replace(/\*/g, '.*')
  url1 = `^${url1}$`
  return new RegExp(url1).test(url2)
}

// get keywords list(array) in route object
function getKwdsInRoute (router) {
  return RESERVED_HOLDERS.concat(
    router.params,
    cutils.getObjVals(router.qsParams)
  )
}

/**
 * redirect rule valid
 * @param  {String}  url
 * @param  {Boolean} hasNamedParams true for custom rule
 * @param  {Boolean} isMathRule     true for custom match rule
 * @return {Boolean}
 */
function testURLRuleValid (url, hasNamedParams, isMathRule) {
  console.log('test url', url)
  // url is empty
  if (!url) throw new Error('ruleIsEmpty')

  // should be a valid url format
  const matches = cutils.urlComponentReg.exec(url)
  if (!matches) throw new Error('invalidURLFormat')
  const [, protocol, host, path] = matches
  // protocol is valid
  // const protocol = matches[1]
  if (!isProtocol(protocol)) throw new Error('invalidProtocol')

  // subdomain must be specified (except custom redirect rule)
  //    abc.{xxx} is invalid
  //    {xxx}.com is invalid
  //    *.com  is invalid
  if (
    !(hasNamedParams && !isMathRule) &&
    !/(?<=(^|\.))[-\w]+\.\w+$/.test(host)
  ) {
    throw new Error('subdomainNotSpecified')
  }

  // remove param placeholder and check the url
  let normalized = url
  if (hasNamedParams) {
    // should has no continues params in custom match rule
    //    {a}{b}.google.com is invalid
    if (isMathRule && /(\{[-\w*]+\}){2,}/.test(normalized)) {
      throw new Error('noContinuesNamedParams')
    }

    // {*named} should only used in the end of the path
    if (!isMathRule && /(\{\*[^}]+\}).+$/.test(path)) {
      throw new Error('starParamsNotAtEnd')
    }
    // replace named params to xxx
    normalized = url.replace(/\{[^}]+\}/g, 'abc')
  }
  // no continuous *s
  if (/\*{2,}/.test(normalized)) throw new Error('noContinuesStars')
  // replace * to xxx
  normalized = normalized.replace(/^\*/, 'http').replace(/\*/g, 'xxx')
  console.log('test normalized', normalized)
  // not a valid rule
  if (!isURL(normalized)) throw new Error('notAValidURL')
  // no params found in redirect url
  // if (hasNamedParams && !getRedirectParamList(url).length) {
  //   return false
  // }
  return true
}

/**
 * is custom route string valid
 * return false if invalid
 * validate string like {abc}.user.com/{hous}/d.html?hah
 * @param  {String}  route
 * @return {Boolean}
 */
function isRouterValid (route) {
  // if the route doesnt has path and query string
  // like http://g.cn
  // then add a / in the end
  if (!/\w\//.test(route)) {
    route += '/'
  }
  testURLRuleValid(route)
  // should be a valid url format
  const matches = cutils.urlComponentReg.exec(route)

  // query string without prefix ?
  const qs = matches[5]

  // Test for named params in querystring
  // /\{\*\w+\}/  for {*named}, not allowed
  // /[?&]\{\w+\}/ or ?{named} or &{named}, not allowd
  // /\{\w+\}(?!&|$)/ should followed by & or eof
  if (
    qs &&
    (/\{\*[^}]+\}/.test(qs) ||
      /[?&]\{[^}]+\}/.test(qs) ||
      /\{[^}]+\}(?!&|$)/.test(qs))
  ) {
    return false
  }
  return true
}

// // http://www.bing.com/{g}-{d}/{*abc}?abc={name}&youse={bcsd}
// // http://www.bing.com/{g}-{d}/{*abc}?abc={name}&youse={bcsd}
// optionalParam = /\((.*?)\)/g
const namedParam = /\{(\(\?)?([^}]+)\}/g
const splatParam = /\{\*([^}]+)\}/g
// escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g
const escapeRegExp = /[-[\]+?.,\\^$|#\s]/g
const queryStrReg = /([\w_+%@!.,*?|~/]+)=\{(\w+)\}/g
/**
 * convert a url pattern to a regexp
 * @param  {String} route url match pattern
 * @param  {String} redirectUrl url redirect pattern
 * @return {Object}
 *                 {
 *                    url: match url, which url will be captured used by chrome
 *                    reg: regexp string can match an url & extract params
 *                    matchUrl: source rule, aka the in-param route
 *                    params: array of var name of each named param in path
 *                    hasQs: has named params in query string
 *                    qsParams: queryString params object { originalName: namedParam}
 *                 }
 */
function getRouter (route, redirectUrl) {
  // remove hash
  route = route.replace(/(#[^#]*)?$/, '')
  if (!isRouterValid(route)) {
    throw new Error('route is invalid')
  }
  if (!isURL(redirectUrl.replace(/(\*|\{[^}]+\})/g, 'abc'))) {
    throw new Error('redirectUrl is invalid')
  }
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
    //   goos.{sub}.abc.com => *.abc.com
    //   goos{sub}.abc.com => *.abc.com
    //   {sub}.abc.com => *.abc.com
    .replace(/^(\.|\{\w+\}|\w+)*\{\w+\}/, '*')
    // replace named holder with * in path
    .replace(/\{\*?\w+\}.*$/, '*')
  // add a asterisk to disable strict match
  result.url = url.replace(/\*+/, '') + '*'

  let parts = route.split('?')
  // route contains more than one ?
  if (parts.length > 2) {
    return result
  }
  result.hasQs = parts.length === 2 && !!parts[1]
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

// have reserved word in url pattern
// return a reserved words list that has been miss used.
function hasReservedWord (router) {
  const params = getKwdsInRoute(router)
  let res = RESERVED_HOLDERS.filter(v => {
    return (
      params.includes(v) || params.includes(`%${v}`) || params.includes(`=${v}`)
    )
  })
  // remove duplicated names
  res = res.filter((v, k) => k === res.indexOf(v))
  return res.length ? res : false
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
  // has duplicated
  return params.some((v, k) => k !== params.indexOf(v))
}

// get a list from redirect to url, eg. http://{sub}.github.com/{name}/{protol}
// %name mean encodeURIComponent name
// =name mean decodeURIComponent name
function getRedirectParamList (url) {
  let matches = url.match(/\{(\w+)\}/g) || []
  return matches.map(v => v.slice(1, -1))
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
  guid,
  getURLParts,
  isProtocol,
  isIP,
  isHost,
  isPath,
  isURL,
  isSubRule,
  testURLRuleValid,
  debounce,
  isRouterValid,
  getRouter,
  isValidReg,
  hasUndefinedWord,
  isKwdsUniq,
  hasReservedWord,
  parseURL
}
