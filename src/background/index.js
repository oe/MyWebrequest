import utils from '@/common/utils'
import collection from '@/common/collection'
import menu from './contextmenu'
import '../external/extension'
import appRules from './rules'

const RULE_TYPES = utils.RULE_TYPES

const logger = window.console

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
  const ruleConfig = appRules[type]
  if (!ruleConfig) return
  if (ruleConfig.webrequests && ruleConfig.webrequests.length) {
    if (ruleConfig.updateConfig) await ruleConfig.updateConfig(isOn)

    const len = ruleConfig.webrequests.length
    for (let i = 0; i < len; i++) {
      const requestConfig = ruleConfig.webrequests[i]
      const action = isOn ? 'addListener' : 'removeListener'
      // if (!isOn && requestConfig.cache) requestConfig.cache = null
      chrome.webRequest[requestConfig.on][action](
        requestConfig.fn,
        rule,
        requestConfig.permit
      )
    }
  }
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
    const ruleConfig = appRules[type]
    const rule = await ruleConfig.getRule()
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
        const rule = await appRules[k].getRule()
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
    const rule = await appRules[key].getRule()
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
