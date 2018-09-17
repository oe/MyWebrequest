import utils from '@/common/utils'
import clonedeep from 'lodash.clonedeep'
import common from './common'

const logger = window.console

let logNum = 0

const defaultRules = {
  urls: []
}

const requestCache = {}

// format querystring
function formatQstr (url) {
  const qs = utils.getQs(url)
  if (!qs) {
    return false
  }
  return {
    formatedData: utils.parseQs(qs),
    rawData: qs
  }
}
/**
 * format http headers [{name, value}] => {name: [value]}
 *     headers may contains duplicated header
 * @param  {Array} headers
 * @return {Object}
 */
function formatHeaders (headers) {
  return Array.from(headers).reduce((acc, cur) => {
    const { name, value } = cur
    if (acc.hasOwnProperty(name)) {
      if (!Array.isArray(acc[name])) acc[name] = [acc[name]]
      acc[name].push(value)
    } else {
      acc[name] = value
    }
    return acc
  }, {})
}

// const cache = {}
const webrequests = [
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
    // dependence requests
    deps: ['logBody'],
    permit: ['requestHeaders'],
    on: 'onSendHeaders'
  }
]

async function getRule () {
  const rule = await common.getRule('log', defaultRules)
  return rule
}

export default {
  getRule,
  webrequests,
  defaultRules
}
