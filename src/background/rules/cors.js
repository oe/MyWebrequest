import utils from '@/common/utils'
import common from './common'

const defaultRules = {
  urls: []
}
const corsRequestCache = {}
const corsRequestRules = [
  {
    name: 'Origin',
    fn (rule, header, details) {
      corsRequestCache[details.requestId].origin = header.value
    }
  },
  {
    name: 'Referer',
    fn (rule, header, details) {
      header.value = details.url
    }
  },
  {
    name: 'X-DevTools-Emulate-Network-Conditions-Client-Id',
    fn (rule, header, details) {
      console.log('remove ', rule.name)
      utils.removeHeaders(details.requestHeaders, rule.name)
    }
  },
  {
    name: 'Access-Control-Request-Headers',
    fn (rule, header, details) {
      corsRequestCache[details.requestId].allowHeaders = header.value
    }
  }
]

const dftAllowHeaders = 'Origin, X-Requested-With, Content-Type, Accept'
const corsResponseRules = [
  {
    name: 'Access-Control-Allow-Origin',
    getValue (details) {
      const origin = corsRequestCache[details.requestId].origin
      const matches = /(https?:\/\/[^/]+)/.exec(origin)
      const value = (matches && matches[1]) || '*'
      return value
    },
    fn (rule, header, details) {
      header.value = rule.getValue(details)
    }
  },
  {
    name: 'Access-Control-Allow-Headers',
    getValue (details) {
      const cache = corsRequestCache[details.requestId]
      const value = (cache && cache.allowHeaders) || dftAllowHeaders
      return value
    },
    fn (rule, header, details) {
      header.value = rule.getValue(details)
    }
  },
  {
    name: 'Access-Control-Allow-Credentials',
    value: 'true'
  },
  {
    name: 'Access-Control-Allow-Methods',
    value: 'POST, GET, OPTIONS, PUT, DELETE'
  },
  {
    name: 'Allow',
    value: 'POST, GET, OPTIONS, PUT, DELETE'
  }
]

function getCorsRuleValue (details, header, rule) {
  if (rule.value) return rule.value
  if (rule.getValue) return rule.getValue(details, header, rule)
}

function handleCorsHeader (details, headers, rules) {
  rules.forEach(rule => {
    let found
    headers.forEach(header => {
      if (header.name !== rule.name) return
      found = true
      if (rule.fn) {
        rule.fn(rule, header, details)
      } else {
        const value = getCorsRuleValue(details, header, rule)
        if (value) header.value = value
      }
    })
    if (found) return
    const value = getCorsRuleValue(details, null, rule)
    if (!value) return
    headers.push({
      name: rule.name,
      value
    })
  })
}

const webrequests = [
  {
    fn (details) {
      const originHeader = details.requestHeaders.find(
        header => header.name === 'Origin'
      )
      if (utils.isXDomain(originHeader && originHeader.value, details.url)) {
        corsRequestCache[details.requestId] = {}
        handleCorsHeader(details, details.requestHeaders, corsRequestRules)
      }
      return {
        requestHeaders: details.requestHeaders
      }
    },
    permit: ['requestHeaders', 'blocking'],
    on: 'onBeforeSendHeaders'
  },
  {
    fn (details) {
      if (corsRequestCache[details.requestId]) {
        handleCorsHeader(details, details.responseHeaders, corsResponseRules)
        delete corsRequestCache[details.requestId]
      }
      return {
        responseHeaders: details.responseHeaders
      }
    },
    permit: ['blocking', 'responseHeaders'],
    on: 'onHeadersReceived'
  }
]

async function getRule () {
  const rule = await common.getRule('cors', defaultRules)
  return rule
}

export default {
  getRule,
  defaultRules,
  webrequests
}
