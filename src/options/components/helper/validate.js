import utils from './utils'

const protocols = ['*', 'http', 'https', 'file', 'ftp']
const escapeRegExp = /[-[\]+?.,/\\^$|#\s]/g

/**
 * is supported protocol
 * @param  {String}  protocol
 * @return {Boolean}
 */
function checkProtocol (protocol) {
  if (protocols.indexOf(protocol) === -1) {
    throw utils.createError('invalid-protocol', protocol)
  }
}

/**
 * is string a valid https? url
 * @param  {String}  url
 */
function checkURL (url) {
  const u = new URL(url)
  // some invalid http url has empty host // with valid host
  u.host && checkProtocol(u.protocol.replace(/:$/, ''))
  let wurl = url
  if (u.pathname === '/') {
    // if url is http://evecalm.com then pathname should be '/'
    //  added / to support this condition
    wurl = url.replace(/\/$/, '') + '/'
  }
  // contains no special chars
  if (u.href !== wurl) {
    throw utils.createError('invalid-url', url)
  }
}

/**
 * is string a valid host
 *   use native object URL to test
 * @param  {String}  host
 */
function checkHost (host) {
  try {
    if (!host) throw new Error()
    checkURL(`http://${host}`)
  } catch (e) {
    throw utils.createError('invalid-host', host)
  }
}

/**
 * is string a valid IP address
 *   simplify judgement, performance may low
 * @param  {String}  ip
 */
function checkIP (ip) {
  try {
    checkHost(ip)
    const pts = ip.split('.')
    if (pts.length !== 4 || !/^\d+$/.test(pts.join(''))) {
      throw new Error()
    }
  } catch (e) {
    throw utils.createError('invalid-ip', ip)
  }
}

function isValidUrlFormat (url) {
  const cmpts = utils.getURLParts(url)
  if (!cmpts) throw utils.createError('invalid-chromerule-format')
  return cmpts
}

/**
 * detect whether chrome rule is valid
 * @param  {String}  url
 */
function checkChromeRule (url) {
  // no continuous star in url
  if (/\*{2,}/.test(url)) throw utils.createError('no-continuous-star')
  const cmpts = isValidUrlFormat(url)
  checkProtocol(cmpts[1])
  const host = cmpts[2]
  // if host contains star *
  if (/\*/.test(host)) {
    // star should be the first char in host
    if (/^([^*])/.test(host)) {
      throw utils.createError('star-shouldbe-first-inhost', RegExp.$1)
    }
    // star in host should only followd by ., aka following are invalid
    //  abc.*/
    //  *aabc.com/
    if (/(\*[^.]+)/.test(host)) {
      throw utils.createError('star-followedby-nodot-inhost', RegExp.$1)
    }
    // subdomain must be specified (except custom redirect rule)
    //    abc.{xxx} is invalid
    //    {xxx}.com is invalid
    //    *.com  is invalid
    if (/\*\.[a-z]$/i.test(host)) {
      throw utils.createError(
        'sencondlevel-domain-shouldbe-specified',
        RegExp.$1
      )
    }
  }
  // port should not in host
  if (/(:\d+)$/.test(host)) {
    throw utils.createError('no-port-inhost', RegExp.$1)
  }
  const u = url.replace(/\*/g, 'http')
  try {
    checkURL(u)
  } catch (e) {
    throw utils.createError('invalid-char-in-chromerule')
  }
}

/**
 * is string a valid reg
 * @param  {String}  reg
 * @return {Boolean}
 */
function checkReg (reg) {
  try {
    /* eslint no-new: "off" */
    new RegExp(reg)
    return true
  } catch (e) {
    return utils.createError('invalid-regexp', e.message)
  }
}

/**
 * is param names valid in match & redirect url
 * @param  {string}  url
 * @param  {boolean}  useReg
 */
function checkParamFormat (url, useReg) {
  const reg = useReg ? /^(\$\d|[a-z])+$/i : /^[a-z\d_-]+$/i
  url.replace(/\{([^}]*)\}/g, ($0, $1) => {
    if (!reg.test($1)) {
      throw utils.createError('invalid-char-paramnames', $1)
    }
  })
}

/**
 * is custom str match rule's params valid
 * @param  {[type]}  url [description]
 * @return {Boolean}     [description]
 */
function checkCustomMatchParams (url) {
  const params = utils.getParamsList(url)
  const duplicated = params.filter((v, i) => params.indexOf(v) !== i)
  if (duplicated.length) {
    throw utils.createError('duplicated-params-found', duplicated)
  }
  const reserved = utils.RESERVED_HOLDERS.filter(v => {
    return params.indexOf(v) !== -1
  })
  if (reserved.length) {
    throw utils.createError('reserved-params-found', reserved)
  }
}

/**
 * is custom match rule
 * @param  {String}  url
 * @return {Boolean}     [description]
 */
function checkCustomMatchRule (url, useReg) {
  url = url.trim()
  if (!url) throw utils.createError('rule-empty')
  return useReg ? checkCustomMatchRegRule(url) : checkCustomMatchStrRule(url)
}

/**
 * is custom match rule (string rule)
 * @param  {string}  url
 */
function checkCustomMatchStrRule (url) {
  checkParamFormat(url)
  const cmpts = isValidUrlFormat(url)

  // should has no continues params in custom match rule
  //    {a}{b}.google.com is invalid
  if (/((\{[^}]+\}){2,})/.test(url)) {
    throw utils.createError('no-continuous-param', RegExp.$1)
  }
  const qs = cmpts[4]
  if (qs) {
    // ?{named} or &{named}, not allowd
    if (/[?&](\{[^}]+\})/.test(qs)) {
      throw utils.createError('no-param-for-qskey', RegExp.$1)
    }
    // {named} should followed by & or eof
    if (/(\{[^}]+\})(?!&|$)/.test(qs)) {
      throw utils.createError('qs-param-shouldbe-val', RegExp.$1)
    }
    // {named} should followed =, aka `={named}` is valid
    if (/[^=](\{[^}]+\})/.test(qs)) {
      throw utils.createError('qs-param-shouldbe-val', RegExp.$1)
    }
  }
  checkCustomMatchParams(url)
  const normalized = url.replace(/\{[^}]+\}/g, 'http')
  if (/(\?.*\*)/.test(normalized)) {
    throw utils.createError('no-star-in-sq', RegExp.$1)
  }
  checkChromeRule(normalized)
}

/**
 * whether redirecturl has no params
 * @param  {String}  redirectUrl
 * @return {Boolean}
 */
function isRedirectHasNoParams (redirectUrl) {
  return !/\{[^}]+\}/.test(redirectUrl) && !/\*/.test(redirectUrl)
}

/**
 * is custom match rule (regexp rule)
 * @param  {String}  reg
 */
function checkCustomMatchRegRule (reg) {
  checkReg(reg)
  if (!/^\^/.test(reg)) throw utils.createError('regrule-should-start-caret')
  if (!/\$$/.test(reg)) throw utils.createError('regrule-should-end-dollar')
  checkChromeRule(utils.convertReg2ChromeRule(reg))
}

function checkCustomRedirectRule (redirectURL, matchURL, useReg) {
  redirectURL = redirectURL.trim()
  if (!redirectURL) throw utils.createError('rule-empty')
  // if redirectURL has No params, then it shuld be a valid url
  if (isRedirectHasNoParams(redirectURL)) {
    checkURL(redirectURL)
    return
  }

  checkParamFormat(redirectURL, useReg)
  let mparams = []
  try {
    mparams = utils.getMatchRuleParams(matchURL, useReg)
  } catch (error) {
    console.warn(`matchURL (${matchURL}) invalid, will skip follow`, error)
    return
  }
  if (/\*/.test(redirectURL)) {
    if (useReg) throw utils.createError('no-star-in-regredirect')
    else if (/\*(?!$)/.test(redirectURL)) {
      throw utils.createError('star-shouldbe-end-redirect')
    }
  }
  const rparams = utils.getMatchRuleParams(redirectURL, useReg)
  const notFound = rparams.filter(p => mparams.indexOf(p) === -1)
  if (notFound.length) {
    throw utils.createError('undefined-params-in-redirect', notFound)
  }
}

/**
 * is rule coverring subRule
 * like: *://*.g.com covers http://ad.g.com or http://*.g.com
 * exmaple: to detect if a custom rule is conflicted with a block rule
 */
function isSubRule (rule, subRule) {
  let matches = utils.getURLParts(rule)
  let prtl1 = matches[1]
  let url1 = matches[2] + matches[3]

  matches = utils.getURLParts(subRule)
  let prtl2 = matches[1]
  let url2 = matches[2] + matches[3]
  if (prtl1 !== '*' && prtl1 !== prtl2) {
    return false
  }

  url1 = url1.replace(escapeRegExp, '(?:\\$&)').replace(/\*/g, '.*')
  url1 = `^${url1}$`
  return RegExp(url1).test(url2)
}

function isURLMatchPattern (url, pattern) {
  let reg = pattern.replace(escapeRegExp, '\\$&').replace(/\*/g, '.*')
  reg = RegExp('^' + reg + '$')
  return reg.test(url)
}

export default {
  checkURL,
  checkHost,
  checkIP,
  checkChromeRule,
  checkCustomMatchParams,
  checkCustomMatchRule,
  isRedirectHasNoParams,
  checkCustomRedirectRule,
  isURLMatchPattern,
  isSubRule
}
