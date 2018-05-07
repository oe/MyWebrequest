import qs from 'qs'
import i18n from './i18n'

// const arrType = ['block', 'hsts', 'hotlink', 'log', 'custom']

export default {
  RULE_TYPES: ['custom', 'block', 'hsts', 'log', 'hotlink', 'gsearch', 'cors'],
  // parse querystring to object
  parseQs: qs.parse,
  // get qs from url, return '' if no querystring found
  getQs (url) {
    // no query string, return ''
    if (!/.+\?/.test(url)) return ''
    return url.replace(/(#[^#]*)?$/, '').replace(/^([^?]*\?)?/, '')
  },
  i18n: i18n.internationalize,
  isUrlRuleType (type) {
    return this.inArray(this.RULE_TYPES, type)
  },
  /**
   * get target url
   * @param  {Object} router   url pattern to match a url
   * @param  {String} url     a real url that match route
   * @return {String}         converted url
   */
  getTargetUrl (router, url) {
    console.log('getTargetUrl, router: %o, url: %s', router, url)
    let params = this.getUrlValues(router, url)
    console.log('params in url: %o', params)
    if (!params) {
      return ''
    }
    return this.fillPattern(router.redirectUrl, params)
  },
  inArray: (function () {
    if (Array.prototype.includes) {
      return function (arr, val) {
        return arr.includes(val)
      }
    } else {
      return function (arr, val) {
        return arr.indexOf(val) !== -1
      }
    }
  })(),
  getObjVals: (function () {
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
  })(),
  findInArr: (function () {
    if (Array.prototype.find) {
      return function (arr, fn) {
        return arr.find(fn)
      }
    } else {
      return function (arr, fn) {
        const len = arr.length
        let i = 0
        while (i < len) {
          if (fn(arr[i], i, arr)) return arr[i]
          ++i
        }
      }
    }
  })()
}
