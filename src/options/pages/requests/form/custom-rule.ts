import utils from './utils'
import validate from './validate'

import { IRedirectRule, EWebRuleType } from '@/types/requests'
import { IStringObject } from '@/types/basic'


// // http://www.bing.com/{g}-{d}/{*abc}?abc={name}&youse={bcsd}
// // http://www.bing.com/{g}-{d}/{*abc}?abc={name}&youse={bcsd}
// optionalParam = /\((.*?)\)/g
const namedParam = /\{(\(\?)?([^}]+)\}/g
// escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g
const escapeRegExp = /[-[\]+?.,/\\^$|#\s]/g
// loose restrict for qs, value could be empty
const queryStrReg = /([^=]+)=\{([^?]*)\}/g

/**
 * convert a url pattern to a regexp
 * @param  {String} route url match pattern
 * @param  {String|Undefined} redirectUrl url redirect pattern
 *                                  with redirectUrl if undefined
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
function getRouter (matchUrl: string, redirectUrl: string, useReg?: boolean) {
  matchUrl = matchUrl.trim()
  redirectUrl = redirectUrl.trim()
  let route = matchUrl.trim()
  // remove hash
  if (!useReg) route = matchUrl.replace(/(#[^#]*)?$/, '')
  validate.checkCustomMatchRule(route, useReg)

  // if redirectUrl is undefined, skip check
  validate.checkCustomRedirectRule(redirectUrl, matchUrl, useReg)
  const noParams = validate.isRedirectHasNoParams(redirectUrl)

  const result = {
    useReg,
    matchUrl: route,
    redirectUrl,
    noParams
  }

  const matchMeta = getMatchMeta(route, noParams, useReg)

  return Object.assign(result, matchMeta)
}

function getMatchMeta (route: string, noParams: boolean, useReg?: boolean) {
  return useReg
    ? getMatchMetaFromReg(route)
    : getMatchMetaFromStr(route, noParams)
}

interface IRouteMeta extends IRedirectRule {
  reg: string
  url: string
  matchUrl: string
}

function getMatchMetaFromStr (route: string, noParamsInRedirect?: boolean) {
  const result = {
    cmd: EWebRuleType.REDIRECT
  } as IRouteMeta
  // if the route doesnt has path and query string
  // like http://g.cn
  // then add a / in the end
  if (!/\w\//.test(route)) {
    route += '/'
  }
  result.matchUrl = route
  // tslint:disable-next-line:prefer-const
  let [, protocol, host, pathname, qs] = utils.getURLParts(route)!
  // let protocol = cmpts[1]

  let url = protocol + '://'

  if (protocol === '*') {
    protocol = '\\w+'
  }
  // remove protocol
  const routeWithoutPrtcl = route.replace(/^([\w*]+):\/\//, '')
  // replace query string with *
  url += routeWithoutPrtcl
    // url with querystring would only match url has querystring
    .replace(/\?.*$/, '?*')
    // replace named holder with * in host
    //   goos.{sub}.abc.com => *.abc.com
    //   goos{sub}.abc.com => *.abc.com
    //   {sub}.abc.com => *.abc.com
    .replace(/^(\.|\{[^}]+\}|[\w-]+)*\{[^}]+\}/, '*')
    // replace named holder with * in path
    .replace(/\{\*?[^}]+\}.*$/, '*')
  // add a asterisk to disable strict match
  result.url = url.replace(/\*+/, '*').replace(/\*$/, '') + '*'
  if (noParamsInRedirect) return result

  const parts = routeWithoutPrtcl.split('?')
  // get pathname & remove named params
  // has wildcard param
  const hasWdCd = /\*/.test(pathname.replace(/\{[^}]\}/g, 'xx'))
  if (hasWdCd) {
    // remove the first * in path and the following
    const reg = route.replace(/(?<=(\w\/[^*?]*))(\*.*)$/, '')
    result.wildcard =
      '^' + reg.replace(/\{[^}]+\}/g, '[^/?&=]+').replace(/\*/g, '.*')
  } else {
    result.wildcard = hasWdCd
  }


  // result.hasQs = !!qs
  const params: string[] = []

  // hand named params in path
  const part = (host + pathname)
    .replace(escapeRegExp, '\\$&')
    .replace(namedParam, function (match, $1, $2) {
      params.push($2)
      if ($1) {
        return match
      } else {
        return '([^/?]+)'
      }
    })
    .replace(/\*/g, '.*')
  result.reg = `^${protocol}:\\/\\/${part}(?:\\?(.*))?`
  result.params = params

  const hasQs = !!qs
  // hand named params in query string
  if (hasQs) {
    const qsParams: IStringObject = {}
    parts[1].replace(queryStrReg, function ($0, $1, $2) {
      try {
        $1 = decodeURIComponent($1)
      } catch (e) { /** */ }
      return (params[$1] = $2)
    })
    result.qsParams = qsParams
    if (!Object.keys(params).length) {
      result.qsParams = false
    }
  } else {
    result.qsParams = hasQs
  }
  if (result.qsParams) {
    // url must has querystring
    result.reg = `^${protocol}:\\/\\/${part}(?:\\?(.+))$`
  } else {
    result.reg = `^${protocol}:\\/\\/${part}(?:\\?(.*))?$`
  }
  return result
}

function getMatchMetaFromReg (route: string) {
  const result = {
    params: utils.getMatchRuleParams(route, true),
    reg: route,
    url: utils.convertReg2ChromeRule(route)
  }

  return result
}

export default {
  getRouter,
  getMatchMeta
}
