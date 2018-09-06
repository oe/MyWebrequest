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
  // count group count, ignore un-captured
  const matches = regStr.match(/\((?!\?:)/g)
  return (matches && matches.length) || 0
}

// get a list from redirect to url, eg. http://{sub}.github.com/{name}/{protol}
// %name mean encodeURIComponent name
// =name mean decodeURIComponent name
function getParamsList (url) {
  let matches = url.match(/\{([^}]+)\}/g) || []
  return matches.map(v => v.slice(1, -1))
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
  getParamsList,
  createError,
  getModuleName,
  getURLParts,
  debounce
}