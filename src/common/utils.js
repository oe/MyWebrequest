import qs from 'qs'
import i18n from './i18n'

const escapeRegExp = /[-[\]+?.,/\\^$|#\s]/g

// const arrType = ['block', 'hsts', 'hotlink', 'log', 'custom']

export default {
  isURLMatchPattern (url, pattern) {
    let reg = pattern.replace(escapeRegExp, '\\$&').replace(/\*/g, '.*')
    reg = RegExp('^' + reg + '$')
    return reg.test(url)
  },
  // get a UUID
  guid () {
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
  },

  // reg to match [protocol, host, path, query]
  urlComponentReg: /^([^:]+):\/\/([^/]+)(\/[^?]*)(\?(.*))?$/,
  RULE_TYPES: ['custom', 'block', 'hsts', 'log', 'hotlink', 'cors'],
  // parse querystring to object
  parseQs: qs.parse,
  /**
   * is url1 cross domain of url2
   */
  isXDomain (url1, url2) {
    if (!url1) return false
    // origins not the same
    return (
      url1.replace(/(?<=(\w))\/.*$/, '') !== url2.replace(/(?<=(\w))\/.*$/, '')
    )
  },

  /**
   * get qs from url, return '' if no querystring found
   */
  getQs (url) {
    // no query string, return ''
    if (!/.+\?/.test(url)) return ''
    return url.replace(/(#[^#]*)?$/, '').replace(/^([^?]*\?)?/, '')
  },

  i18n: i18n.internationalize,

  /**
   * is type a valid rule type
   * @return {Boolean}      [description]
   */
  isUrlRuleType (type) {
    return this.RULE_TYPES.indexOf(type) !== -1
  },

  /**
   * preprocess a router when use
   */
  preprocessRouter (router) {
    delete router.createdAt
    delete router.updatedAt
    if (!router.noParams) {
      router.reg = RegExp(router.reg)
      if (router.hasWdCd && router.wdCdReg) {
        router.wdCdReg = RegExp(router.wdCdReg)
      }
    }
    return router
  },
  /**
   * get target url for custom rule
   * @param  {Object} router   url pattern to match a url
   * @param  {String} url     a real url that match route
   * @return {String}         converted url
   */
  getTargetUrl (router, url) {
    console.log('getTargetUrl, router: %o, url: %s', router, url)
    // if no params in redirect url, then use redirect url as result
    if (router.noParams) return router.redirectUrl

    let params = this.getUrlValues(router, url)
    console.log('params in url: %o', params)
    if (!params) {
      return ''
    }
    return this.fillPattern(router.redirectUrl, params)
  },
  /**
   * get a key-value object from the url which match the pattern
   * @param  {Object} r   {reg: ..., params: ''} from getRouter
   * @param  {String} url a real url that match that pattern
   * @return {Object}
   */
  getUrlValues (r, url) {
    let k, matches, v
    let res = {}
    try {
      matches = r.reg.exec(url)
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

    if (r.useReg) {
      res['$0'] = url
    }

    // get query string values
    if (r.hasQs) {
      let qsParams = this.parseQs(this.getQs(url))

      for (k of Object.keys(r.qsParams || {})) {
        v = r.qsParams[k]
        res[v] = qsParams[k] || ''
      }
    }

    this.urlComponentReg.exec(url)
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
  },

  // fill a custom url redirect rule with data
  fillPattern (pattern, data) {
    pattern = pattern.replace(
      /(?<=[?|&])([^=]+)=\{([^}]+)\}/g,
      ($0, $1, $2) => {
        const val = data[$2] != null ? data[$2] : ''
        return this.toQueryString($1, val)
      }
    )
    let url = pattern.replace(/\{([^}]+)\}/g, function ($0, $1) {
      const val = data[$1] != null ? data[$1] : ''
      // encodeURI instead of encodeURIComponent
      return encodeURI(val)
    })
    if (data.__wildcard) {
      url = url.replace(/\*$/, data.__wildcard)
    }
    // final url may not be a valid url
    return url.replace(/\?$/, '')
  },

  /**
   * convert key-val into an querysting: encode(key)=encode(val)
   * if val is an array, there will be an auto conversion
   * @param  {String} key
   * @param  {String|Array} val
   * @return {String}
   */
  toQueryString (key, val) {
    if (Array.isArray(val)) {
      try {
        key = decodeURIComponent(key)
        key = key.replace(/\[\]$/, '') + '[]'
        key = encodeURIComponent(key).replace('%20', '+')
      } catch (e) {}
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
}
