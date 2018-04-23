import clonedeep from 'lodash.clonedeep'
import utils from '@/common/utils'
import collection from '@/common/collection'

const gsearchRuleBasic = [
  '*://www.google.com/url*',
  '*://www.google.com.hk/url*'
]

const RULES_TYPE = ['custom', 'block', 'hsts', 'log', 'hotlink', 'gsearch']

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
let logNum = 0
const requestCache = {}

// format querystring
function formatQstr (url) {
  const qs = utils.getQs(url)
  const params = utils.parseQs(qs)
  if (!qs) {
    return false
  }
  const result = {}
  let k, v
  for (k in params) {
    if (!params.hasOwnProperty(k)) continue
    v = params[k]
    if (Array.isArray(v)) {
      k = k.replace(/\[\]$/, '')
    }
    result[k] = v
  }
  return {
    formatedData: result,
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
          iconUrl: '/img/icon38.png',
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
        '/img/icon48.png',
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

const onRequests = {
  gsearch: {
    fn: function (details) {
      const qs = formatQstr(details.url).formatedData
      const url = (qs && qs.url) || details.url
      return { redirectUrl: url }
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  },
  custom: {
    fn: function (details) {
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
    fn: function (details) {
      console.log('block url: ' + details.url)
      return {
        cancel: true
      }
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  },
  hsts: {
    fn: function (details) {
      return {
        redirectUrl: details.url.replace(/^http:\/\//, 'https://')
      }
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  },
  hotlink: {
    fn: function (details) {
      const headers = details.requestHeaders
      let len = headers.length
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
  logBody: {
    fn: function (details) {
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
    fn: function (details) {
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
      '19': '/img/' + iconStyle + 'icon19.png',
      '38': '/img/' + iconStyle + 'icon38.png'
    }
  })
}

function init () {
  const onoff = collection.get4Bg('onoff')
  let len = RULES_TYPE.length
  let type
  while (len--) {
    type = RULES_TYPE[len]
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
    let len = RULES_TYPE.length
    while (len--) {
      let k = RULES_TYPE[len]
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
