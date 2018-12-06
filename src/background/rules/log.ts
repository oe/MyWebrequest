import utils from '@/common/utils'
import clonedeep from 'lodash.clonedeep'

import { ILogRule, IWebRequestRules } from '@/types/web-rule'

const logger = window.console

let logNum = 0

const requestCache = {}

// format querystring
function formatQstr (url: string) {
  const qs = utils.getQs(url)
  if (!qs) {
    return false
  }
  return {
    formatedData: utils.parseQs(qs),
    rawData: qs
  }
}
interface IFormattedHeaders {
  [k: string]: string | string[]
}
/**
 * format http headers [{name, value}] => {name: [value]}
 *     headers may contains duplicated header
 * @param  {Array} headers
 * @return {Object}
 */
function formatHeaders (headers: chrome.webRequest.HttpHeader[]) {
  return Array.from(headers).reduce((acc, cur) => {
    const { name, value } = cur
    if (acc.hasOwnProperty(name)) {
      // @ts-ignore
      if (!Array.isArray(acc[name])) acc[name] = [acc[name]]
      // @ts-ignore
      acc[name].push(value)
    } else {
      // @ts-ignore
      acc[name] = value
    }
    return acc
  }, {} as IFormattedHeaders)
}

// const cache = {}
const webrequests: IWebRequestRules<ILogRule> = [
  {
    fn (details) {
      if (details.requestBody) {
        return (requestCache[details.requestId] = clonedeep(
          details.requestBody
        ))
      }
    },
    permit: ['requestBody'],
    on: 'onBeforeRequest'
  },
  {
    fn (details) {
      ++logNum
      const url = details.url
      const rid = details.requestId

      const queryBody = formatQstr(details.url)
      if (queryBody) details.queryBody = queryBody

      let domain = /^(?:[\w-]+):\/\/([^/]+)\//.exec(url)
      domain = domain ? domain[1] : url

      if (requestCache[rid]) details.requestBody = requestCache[rid]
      details.requestHeaders = formatHeaders(details.requestHeaders)
      logger.log(
        '%c%d %o %csent to domain: %s',
        'color: #086',
        logNum,
        details,
        'color: #557c30',
        domain
      )
      delete requestCache[rid]
    },
    permit: ['requestHeaders'],
    on: 'onSendHeaders'
  }
]

export default webrequests