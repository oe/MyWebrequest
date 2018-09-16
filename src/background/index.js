import clonedeep from 'lodash.clonedeep'
import utils from '@/common/utils'
import collection from '@/common/collection'
import menu from './contextmenu'
import '../external/extension'

const RULE_TYPES = utils.RULE_TYPES
let logNum = 0
const requestCache = {}
// let customRouterCache = null

const logger = window.console

const FEATURE_RULES = {
  block: {
    urls: []
  },
  hsts: {
    urls: []
  },
  log: {
    urls: []
  },
  cors: {
    urls: []
  },
  hotlink: {
    urls: []
  },
  custom: {
    urls: []
  }
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
      removeHeaders(details.requestHeaders, rule.name)
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
/**
 * remove headers with names
 * @param  {Array} headers headers
 * @param  {Array|String} names   names to remove
 * @return {Array}
 */
function removeHeaders (headers, names) {
  let isInNames
  if (Array.isArray(names)) {
    isInNames = name => names.includes(name)
  } else {
    isInNames = name => names === name
  }
  let len = headers.length
  while (len--) {
    if (isInNames(headers[len].name)) {
      headers.splice(len, 1)
    }
  }
}

// handlers for every feature
const onRequests = {
  custom: {
    // cache data for frequently usage
    cache: null,
    fn (details) {
      let k, rule, url
      const rules = onRequests.custom.cache
      for (k in rules) {
        if (!rules.hasOwnProperty(k)) continue
        rule = rules[k]
        console.log('get target Url, rule: %o, url: %s', rule, details.url)
        url = utils.getTargetUrl(rule, details.url)
        console.log('then target url is: %s', url)
        if (url) {
          return {
            redirectUrl: url
          }
        }
      }
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  },
  block: {
    fn (details) {
      console.warn('block url: ' + details.url)
      return {
        cancel: true
      }
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  },
  hsts: {
    fn (details) {
      return {
        redirectUrl: details.url.replace(/^http:\/\//, 'https://')
      }
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  },
  hotlink: {
    fn (details) {
      const headers = details.requestHeaders
      // remove referer
      removeHeaders(headers, 'Referer')
      return {
        requestHeaders: headers
      }
    },
    permit: ['requestHeaders', 'blocking'],
    on: 'onBeforeSendHeaders'
  },
  corsRequest: {
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
  cors: {
    fn (details) {
      if (corsRequestCache[details.requestId]) {
        handleCorsHeader(details, details.responseHeaders, corsResponseRules)
        delete corsRequestCache[details.requestId]
      }
      return {
        responseHeaders: details.responseHeaders
      }
    },
    deps: ['corsRequest'],
    permit: ['blocking', 'responseHeaders'],
    on: 'onHeadersReceived'
  },
  logBody: {
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
  log: {
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
}

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
const pushNotification = (function () {
  const cbs = {}
  const notify = function (title, content, notifiId, cb) {
    notifiId = notifiId || ''
    chrome.notifications.create(
      notifiId,
      {
        type: 'basic',
        iconUrl: '/static/icons/icon38.png',
        title: title,
        message: content
      },
      function () {}
    )
    if (notifiId && cb instanceof Function) {
      cbs[notifiId] = cb
    }
  }
  chrome.notifications.onClicked.addListener(function (nId) {
    cbs[nId] && cbs[nId]()
  })
  chrome.notifications.onClosed.addListener(function (nId) {
    delete cbs[nId]
  })
  return notify
})()

// toggle rule on or off
async function toggleRule (type, rule, isOn) {
  const requestCfg = onRequests[type]
  if (!requestCfg) return
  if (requestCfg.deps && requestCfg.deps.length) {
    const deps = requestCfg.deps
    for (let i = 0; i < deps.length; i++) {
      await toggleRule(deps[i], rule, isOn)
    }
  }
  // update custom rule cache
  if (type === 'custom') {
    onRequests.custom.cache = isOn ? await collection.getRouter4Custom() : {}
  }
  const action = isOn ? 'addListener' : 'removeListener'
  if (!isOn && requestCfg.cache) requestCfg.cache = null
  chrome.webRequest[requestCfg.on][action](
    requestCfg.fn,
    rule,
    requestCfg.permit
  )
}

// get rule object by rule type
async function getRule (type) {
  console.warn('get rule type', type)
  // clone Depp to avoid urls duplication
  const rule = clonedeep(FEATURE_RULES[type])
  if (!rule) {
    console.warn('cant find rules of', type)
    return
  }
  let urls = await collection.getData4Bg(type)
  rule.urls.push(...urls)
  console.warn(`all rules of ${type}`, rule.urls)
  // return rule of has urls
  return rule.urls.length && rule
}

// update extension ico near location bar
function updateExtIcon (iconStyle) {
  if (iconStyle !== 'grey') iconStyle = ''

  if (iconStyle) iconStyle += '-'

  chrome.browserAction.setIcon({
    path: {
      '19': '/static/icons/' + iconStyle + 'icon19.png',
      '38': '/static/icons/' + iconStyle + 'icon38.png'
    }
  })
}

async function init () {
  console.warn('init all settings')
  const onoff = await collection.getData4Bg('onoff')
  let len = RULE_TYPES.length
  let type
  console.warn('init', onoff, RULE_TYPES)
  while (len--) {
    type = RULE_TYPES[len]
    if (!onoff[type]) {
      onoff[type] = false
      continue
    }
    const rule = await getRule(type)
    if (!rule) {
      onoff[type] = false
      continue
    }

    if (type === 'log') {
      pushNotification(
        utils.i18n('bg_logison'),
        utils.i18n('bg_logon_tip'),
        'log-enabled-hint',
        function () {
          window.open('/options/index.html#/log')
        }
      )
    }
    await toggleRule(type, rule, true)
  }
  await collection.save('onoff', onoff)
  const config = await collection.get('config')
  updateExtIcon(config.iconStyle)
  if (config.showQrMenu) {
    menu.add()
  }
}

init()

async function handleKeyChange (key, newVal, oldVal) {
  try {
    if (key === 'config') {
      if (newVal.iconStyle !== oldVal.iconStyle) {
        updateExtIcon(newVal.iconStyle)
      }
      if (newVal.showQrMenu !== oldVal.showQrMenu) {
        newVal.showQrMenu ? menu.add() : menu.removeAll()
      }
      return
    }
    if (key === 'onoff') {
      let len = RULE_TYPES.length
      while (len--) {
        const k = RULE_TYPES[len]
        if (newVal[k] === oldVal[k]) continue
        const rule = await getRule(k)
        console.log('onoff change, feature: %s turned %s', k, newVal[k])
        if (!rule) {
          console.log('disable feature because %s has no rule', k)
          await collection.setOnoff(k, false)
          return
        }
        await toggleRule(k, rule, newVal[k])
      }
      return
    }
    const isEnabled = await collection.getOnoff(key)
    if (!isEnabled) return
    const rule = await getRule(key)
    await toggleRule(key, rule, false)
    // if no rule, just turn off
    if (!rule) {
      await collection.setOnoff(key, false)
      return
    }
    await toggleRule(key, rule, true)
  } catch (error) {
    logger.warn(
      'values(' + newVal + '/' + oldVal + ') of ' + key + ' is invalid',
      error
    )
  }
}

// on ext config updated
chrome.storage.onChanged.addListener(async function (changes, area) {
  console.log('onchange', changes, area)
  // ignore none sync area change
  if (area !== 'sync') return
  let keys = Object.keys(changes)
  console.log('onchange', changes, area)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const change = changes[key]
    await handleKeyChange(key, change.newValue || {}, change.oldValue || {})
  }
  chrome.webRequest.handlerBehaviorChanged()
})

// on ext updated
chrome.runtime.onInstalled.addListener(async () => {
  const isUpdate = await collection.isExtUpdate()
  if (isUpdate) chrome.runtime.openOptionsPage()
})
