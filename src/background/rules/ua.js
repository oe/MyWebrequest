import utils from '@/common/utils'
import collection from '@/common/collection'
import RuleProcessor, { removeHeaders, isRuleEnabled } from './common'

// cache data for frequently usage
let cachedRules = []

// update cache
async function updateCache (isOn) {
  if (isOn) {
    // ignore disabled
    let result = await collection.get('ua')
    cachedRules = result.filter(isRuleEnabled).map(item => ({
      reg: utils.convertPattern2Reg(item.url),
      ua: item.ua
    }))
  } else {
    cachedRules = []
  }
}

let tabCache = {}

function onTabUpdate (tabId, changeInfo, tab) {
  const isUpdate = typeof tabId === 'number'
  if (!isUpdate) tab = tabId
  // ignore tab been discarded
  if (changeInfo && changeInfo.discarded) return
  const url = tab.url
  if (!url || !/^(https?|file|ftp)/.test(url)) return removeTabCache(tab.id)
  const matched = cachedRules.find(item =>
    utils.isURLMatchPattern(url, item.reg)
  )
  if (!matched) return removeTabCache(tab.id)
  addTabCache(tab.id, matched)
}

function removeTabCache (id) {
  delete tabCache[id]
}

function addTabCache (id, data) {
  const navi = {
    ua: data.ua
  }
  tabCache[id] = navi
  updateTabUa(id, navi)
}

function updateTabUa (tabId, navi) {
  chrome.tabs.executeScript(
    tabId,
    {
      file: '/content-scripts/change-ua.js',
      // execute js ASAP, make QR feature available even before page loaded
      runAt: 'document_start',
      // change all frame's ua
      allFrames: true
    },
    () => {
      if (chrome.runtime.lastError) {
        return console.warn(chrome.runtime.lastError)
      }
      chrome.tabs.sendMessage(tabId, { cmd: 'update-ua', navi })
    }
  )
}

function toggleTabListenr (isOn) {
  const method = isOn ? 'addListener' : 'removeListener'
  chrome.tabs.onCreated[method](onTabUpdate)
  chrome.tabs.onUpdated[method](onTabUpdate)
  if (isOn) {
    chrome.tabs.query({ discarded: false }, tabs => {
      tabs.forEach(tab => onTabUpdate(tab))
    })
  } else {
    tabCache = {}
  }
}

const webrequests = [
  {
    fn (details) {
      const matched = tabCache[details.tabId]
      if (!matched) return
      removeHeaders(details.requestHeaders, 'User-Agent')
      details.requestHeaders.push({
        name: 'User-Agent',
        value: matched.ua
      })

      return {
        requestHeaders: details.requestHeaders
      }
    },
    permit: ['requestHeaders', 'blocking'],
    on: 'onBeforeSendHeaders'
  }
]

export default new RuleProcessor('ua', {
  webrequests,
  async toggle (isOn) {
    // listen for all urls
    const rule = { urls: ['*://*/*', 'ftp://*/*'] }
    this._toggleWebRequest(rule, isOn)
    toggleTabListenr(isOn)
    await updateCache(isOn)
  }
})
