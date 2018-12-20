import { pushNotification, i18n } from '@/common/utils'
import { diffObject } from './requests/utils'
import collection from '@/common/collection'
import { IRequestConfig, EWebRuleType } from '@/types/requests'
import { IExtSettings } from '@/types/settings'
import { onRequestsChange } from './requests'

const logger = window.console

async function init () {
  console.warn('init all settings')
  const settings = await collection.get('settings')
  updateSettings(settings)
  const requests = await collection.get('requests')
  onRequestsChange(requests)
  if (isLogEnabled(requests)) {
    pushNotification({
      title: i18n('bg_logison'),
      content: i18n('bg_logon_tip'),
      onclick: function () {
        window.open('/options/index.html#/requests')
      }
    })
  }
}

function isLogEnabled (requests?: IRequestConfig[]) {
  if (!requests || !requests.length) return false
  return requests.some((rule) => {
    return rule.isValid && rule.enabled && rule.rules.some((item) => item.cmd === EWebRuleType.LOG)
  })
}

// update extension ico near location bar
function updateSettings (newVal: IExtSettings, oldVal?: IExtSettings) {
  const diffResult = diffObject(newVal, oldVal || ({} as IExtSettings))
  const diff = Object.assign({}, diffResult.added, diffResult.updated)
  if ('iconStyle' in diff) {
    let iconStyle = diff.iconStyle as string
    if (iconStyle !== 'grey') iconStyle = ''

    if (iconStyle) iconStyle += '-'

    chrome.browserAction.setIcon({
      path: {
        '19': '/static/icons/' + iconStyle + 'icon19.png',
        '38': '/static/icons/' + iconStyle + 'icon38.png'
      }
    })
  }
}




init()

async function handleKeyChange (key: string, newVal: any, oldVal?: any) {
  try {
    switch (key) {
      case 'settings':
        updateSettings(newVal, oldVal)
        break
      case 'requests':
        onRequestsChange(newVal, oldVal)
        break
      default:
        console.log('unsupported key', key, newVal)
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
  const keys = Object.keys(changes)
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
