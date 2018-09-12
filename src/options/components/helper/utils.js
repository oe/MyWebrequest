import cutils from '@/common/utils'

window.cutils = cutils

function createError (msg, params) {
  const e = new Error(msg)
  if (!Array.isArray(params) && typeof params !== 'object') {
    params = [params]
  }
  e.meta = params
  return e
}

// get module name from route path
function getModuleName (path) {
  return path.replace(/(^\/|(?<=[^/])\/.*$)/g, '')
}
/**
 * is string a supported protocol
 * @param  {String}  protocol
 * @return {Boolean}
 */

// pre-defined placeholders
const RESERVED_HOLDERS = ['p', 'h', 'm', 'r', 'q', 'u']

/**
 * parse url by reg
 *  match [, protocol, host, path, query]
 *   difference from parseURL: (url) may be invalid url but a valid rule
 * @param  {String} url string
 * @return {Array}
 */
function getURLParts (url) {
  return url.match(cutils.urlComponentReg)
}

/**
 * convert regstr to a valid chrome match pattern
 * @param {string} regStr regstr match rule
 */
function convertReg2ChromeRule (regStr) {
  // remove heading & trailing char then replace groups to *
  let rule = replaceRegGroup(regStr.replace(/(^\^|\$$)/g, ''), '\\*')
  return (
    rule
      // replace repeated special char to *
      .replace(/(?<!\\)((\\[swdSWD]|\.)(\*|\+|\?|\{\d+(,(\d+)?)?\})?)/g, '\\*')
      // remove /
      .replace(/\\/g, '')
      // replace continuous * to one *
      .replace(/\*+/g, '*')
  )
}

/**
 * replace regexp str () or [] to replaceStr
 * @param {string} regStr regexp str
 * @param {string} replaceStr group replacement
 */
function replaceRegGroup (regStr, replaceStr) {
  let len = 0
  let char = ''
  let isEscaped = false
  let groupCount = 0
  let startIdx = 0
  const groups = []
  const groupBracket = {
    '(': ')',
    '[': ']'
  }
  let closeBracket = ''
  while ((char = regStr[len++])) {
    if (isEscaped) {
      isEscaped = false
      continue
    }
    if (char === '\\') {
      isEscaped = true
      continue
    }
    if (
      (!closeBracket && groupBracket[char]) ||
      closeBracket === groupBracket[char]
    ) {
      ++groupCount
      if (!closeBracket) closeBracket = groupBracket[char]
      if (groupCount === 1) {
        startIdx = len - 1
      }
      continue
    }
    if (char === closeBracket) {
      --groupCount
      if (groupCount === 0) {
        closeBracket = ''
        groups.push([startIdx, len])
      }
    }
  }
  len = groups.length
  const regChars = regStr.split('')
  while (len--) {
    const group = groups[len]
    regChars.splice(group[0], group[1] - group[0], replaceStr)
  }
  return regChars.join('')
}

/**
 * trim reg rule & add ^& if not exists
 * @param  {string} reg
 * @return {string}
 */
function normalizeRegRule (regStr) {
  regStr = regStr.trim()
  if (!/^\^/.test(regStr)) {
    regStr = '^' + regStr
  }
  if (!/\$$/.test(regStr)) {
    regStr += '$'
  }
  return regStr
}

/**
 * count regstr group count
 * @param {string} regStr
 */
function getRegGroupCount (regStr) {
  // count group count, ignore un-captured & escaped
  const matches = regStr.match(/(?<!(\\|\[[^]*))\((?!\?)/g)
  return (matches && matches.length) || 0
}

// get a list from redirect to url, eg. http://{sub}.github.com/{name}/{protol}
// %name mean encodeURIComponent name
// =name mean decodeURIComponent name
function getParamsList (url) {
  const paramReg = /\{([^}]+)\}/g
  let matches = url.match(paramReg) || []
  const params = matches.map(v => v.slice(1, -1))
  // has star arguments
  if (/\/.*\*/.test(url.replace(paramReg, 'xx'))) {
    params.push('*')
  }
  return params
}

function getMatchRuleParams (url, useReg) {
  if (useReg) {
    // RegExp only got properties $0 ~ $9
    const total = Math.min(9, getRegGroupCount(url))
    const params = Array.apply(null, Array(total)).map((u, i) => '$' + (i + 1))
    params.push('$0')
    return params
  }
  return getParamsList(url)
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
  RESERVED_HOLDERS,
  normalizeRegRule,
  getRegGroupCount,
  convertReg2ChromeRule,
  getParamsList,
  getMatchRuleParams,
  createError,
  getModuleName,
  getURLParts,
  debounce
}
