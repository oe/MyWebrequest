import clonedeep from 'lodash.clonedeep'
import utils from '@/common/utils'
import collection from '@/common/collection'

const gsearchRuleBasic = [
  '*://www.google.com/url*',
  '*://www.google.com.hk/url*'
]

const RULE_TYPES = utils.RULE_TYPES
let logNum = 0
const requestCache = {}

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
  },
  gsearch: {
    urls: gsearchRuleBasic
  }
}

const corsRequestCache = {}
const corsRequestRules = [
  {
    name: 'Origin',
    fn (rule, header, details) {
      header.value = details.url
    }
  },
  {
    name: 'Access-Control-Request-Headers',
    fn (rule, header, details) {
      const cache =
        corsRequestCache[details.requestId] ||
        (corsRequestCache[details.requestId] = {})
      cache.allowHeaders = header.value
    }
  }
]

const corsResponseRules = [
  {
    name: 'Access-Control-Allow-Origin',
    value: '*'
  },
  {
    name: 'Access-Control-Allow-Headers',
    fn (rule, header, details) {
      const cache = corsRequestCache[details.requestId]
      if (!cache) return
      header.value = cache.allowHeaders
      delete corsRequestCache[details.requestId]
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

// handlers for every feature
const onRequests = {
  gsearch: {
    fn (details) {
      const qs = formatQstr(details.url).formatedData
      const url = (qs && qs.url) || details.url
      return { redirectUrl: url }
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  },
  custom: {
    fn (details) {
      let k, rule, url
      const rules = collection.get4Bg('custom')
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
      console.log('block url: ' + details.url)
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
      let len = headers.length
      // remove referer
      while (len--) {
        if (headers[len] === 'Referer') {
          headers.splice(len, 1)
          break
        }
      }
      return {
        requestHeaders: headers
      }
    },
    permit: ['requestHeaders', 'blocking'],
    on: 'onBeforeSendHeaders'
  },
  corsRequest: {
    fn (details) {
      corsRequestRules.forEach(rule => {
        let found
        details.requestHeaders.forEach(header => {
          if (header.name !== rule.name) return
          found = true
          if (rule.fn) {
            rule.fn.call(null, rule, header, details)
          } else if (rule.value) {
            header.value = rule.value
          }
        })
        if (found || !rule.value) return
        details.requestHeaders.push({
          name: rule.name,
          value: rule.value
        })
      })
      return {
        requestHeaders: details.requestHeaders
      }
    },
    permit: ['requestHeaders', 'blocking'],
    on: 'onBeforeSendHeaders'
  },
  cors: {
    fn (details) {
      corsResponseRules.forEach(rule => {
        let found
        details.responseHeaders.forEach(header => {
          if (header.name !== rule.name) return
          found = true
          if (rule.fn) {
            rule.fn.call(null, rule, header, details)
          } else if (rule.value) {
            header.value = rule.value
          }
        })
        if (found || !rule.value) return
        details.responseHeaders.push({
          name: rule.name,
          value: rule.value
        })
      })
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
  var cbs, fn
  fn = null
  if (chrome.notifications) {
    cbs = {}
    fn = function (title, content, notifiId, cb) {
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
  } else if (window.webkitNotifications) {
    fn = function (title, content) {
      var notifi
      notifi = webkitNotifications.createNotification(
        '/static/icons/icon38.png',
        title,
        content
      )
      return notifi.show()
    }
  } else {
    fn = function () {}
  }
  return fn
})()

// toggle rule on or off
function toggleRule (type, rule, isOn) {
  const requestCfg = onRequests[type]
  if (!requestCfg) return
  if (requestCfg.deps) {
    requestCfg.deps.forEach(type => {
      toggleRule(type, rule, isOn)
    })
  }
  const action = isOn ? 'addListener' : 'removeListener'
  chrome.webRequest[requestCfg.on][action](
    requestCfg.fn,
    rule,
    requestCfg.permit
  )
}

// get rule object by rule type
function getRule (type) {
  // clone Depp to avoid urls duplication
  const rule = clonedeep(FEATURE_RULES[type])
  if (!rule) return
  rule.urls.push(...collection.get4Bg(type))
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

function init () {
  const onoff = collection.get4Bg('onoff')
  let len = RULE_TYPES.length
  let type
  while (len--) {
    type = RULE_TYPES[len]
    if (!onoff[type]) {
      onoff[type] = false
      continue
    }
    const rule = getRule(type)
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
    toggleRule(type, rule, true)
  }
  collection.save('onoff', onoff)
  updateExtIcon(collection.getKey('iconStyle'))
}

init()

window.addEventListener('storage', function (event) {
  console.log('storage event fired %o', event)
  const type = event.key
  let newData, oldData
  try {
    newData = JSON.parse(event.newValue || '[]')
    oldData = JSON.parse(event.oldValue || '[]')
  } catch (error) {
    logger.warn(
      'values(' + newData + '/' + oldData + ') of ' + type + ' is invalid',
      error
    )
    return
  }
  if (type === 'config') {
    if (newData.iconStyle !== oldData.iconStyle) {
      updateExtIcon(newData.iconStyle)
    }
    return
  }
  if (type === 'onoff') {
    let len = RULE_TYPES.length
    while (len--) {
      let k = RULE_TYPES[len]
      if (newData[k] === oldData[k]) continue
      const rule = getRule(k)
      console.log('onoff change, feature: %s turned %s', k, newData[k])
      if (!rule) {
        console.log('disable feature because %s has no rule', k)
        collection.setOnoff(k, false)
        return
      }
      toggleRule(k, rule, newData[k])
    }
    return
  }
  if (!collection.getOnoff(type)) return
  const rule = getRule(type)
  toggleRule(type, rule, false)
  // if no rule, just turn off
  if (!rule) {
    collection.setOnoff(type, false)
    return
  }
  toggleRule(type, rule, true)

  chrome.webRequest.handlerBehaviorChanged()
})
