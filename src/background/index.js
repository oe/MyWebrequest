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
  console.warn('init', onoff, RULE_TYPES)
  handleKeyChange('onoff', onoff)
  const isLogOn = await collection.getOnoff('log')
  if (isLogOn) {
    pushNotification(
      utils.i18n('bg_logison'),
      utils.i18n('bg_logon_tip'),
      'log-enabled-hint',
      function () {
        window.open('/options/index.html#/log')
      }
    )
  }
  const config = await collection.get('config')
  updateExtIcon(config.iconStyle)
  if (config.showQrMenu) {
    menu.add()
  }
}

init()

async function handleKeyChange (key, newVal, oldVal) {
  try {
    switch (key) {
      case 'config':
        newVal = newVal || {}
        oldVal = oldVal || {}
        if (newVal.iconStyle !== oldVal.iconStyle) {
          updateExtIcon(newVal.iconStyle)
        }
        if (newVal.showQrMenu !== oldVal.showQrMenu) {
          newVal.showQrMenu ? menu.add() : menu.removeAll()
        }
        break
      case 'onoff':
        newVal = newVal || {}
        oldVal = oldVal || {}
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
          if (appRules[k]) {
            await appRules[k].toggle(newVal[k])
          }
        }
        break
      default:
        // const isEnabled = await collection.getOnoff(key)
        if (!appRules[key]) return
        await appRules[key].onChange(newVal, oldVal)
      // if no rule, just turn off
      // if (enabled === false) {
      //   await collection.setOnoff(key, false)
      //   return
      // }
    }
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
    await handleKeyChange(key, change.newValue, change.oldValue)
  }
})

// on ext updated
chrome.runtime.onInstalled.addListener(async () => {
  const isUpdate = await collection.isExtUpdate()
  if (isUpdate) chrome.runtime.openOptionsPage()
})
