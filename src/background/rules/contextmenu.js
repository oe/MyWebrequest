import RuleProcessor from './common'

let cachedRules = []

const ALL_URL_PTTRNS = ['*://*/*', 'file://*/*', 'ftp://*/*']

const menuActions = {
  qrcode (content, tab) {
    const data = { content }
    chrome.storage.local.set({ 'qr-menu': data })
    console.log('qr-menu', data)
    chrome.tabs.executeScript(tab.id, {
      file: '/content-scripts/qr.js',
      // execute js ASAP, make QR feature available even before page loaded
      runAt: 'document_start'
    })
  }
}

function updateCache (isOn) {
  cachedRules = isOn ? {} : []
  console.log('cachedRules', cachedRules)
}
// remove all context menu
function removeAll () {
  console.warn('remove menu')
  chrome.contextMenus.removeAll()
}

function remove (id) {
  chrome.contextMenus.remove(id)
}

function addMenu (item) {
  chrome.contextMenus.create(normalizeMenuConfig(item))
}

function updateMenu (item) {
  chrome.contextMenus.update(item.id, normalizeMenuConfig(item, true))
}

function normalizeMenuConfig (item, withoutID) {
  const documentUrlPatterns =
    item.documentUrlPatterns === true
      ? ALL_URL_PTTRNS
      : Array.isArray(item.documentUrlPatterns)
        ? item.documentUrlPatterns
        : []
  const config = {
    title: item.title,
    type: 'normal',
    contexts: item.contexts,
    documentUrlPatterns
  }
  if (!withoutID) config.id = item.id
  return config
}

function getMenuitemsDiggest (vals) {
  return vals.map(item => ({
    id: item.id,
    updatedAt: item.updatedAt,
    enabled: item.enabled
  }))
}

// compare menu
function compareMenu (v1, v2) {
  // not match
  if (v1.id !== v2.id) return false
  // not change
  if (
    (v1.enabled === false && v2.enabled === false) ||
    v1.updatedAt === v2.updatedAt
  ) {
    return 'stable'
  }
  return v1.enabled ? (v2.enabled ? 'updated' : 'added') : 'removed'
}

// calc diff of new & old menuitems
function diff (newVal, oldVal) {
  const nv = getMenuitemsDiggest(newVal)
  const ov = getMenuitemsDiggest(newVal)
  let i = 0
  let j = 0
  const result = {
    updated: [],
    added: [],
    removed: []
  }
  while (i < nv.length) {
    const current = nv[i]
    let found = false
    j = 0
    while (j < ov.length) {
      const comp = compareMenu(current, ov[j])
      if (comp === false) {
        ++j
        continue
      }
      ov.slice(j, 1)
      found = true
      if (result[comp]) {
        result[comp].push(current.id)
      }
    }
    if (!found) ++i
    else nv.slice(i, 0)
  }
  if (nv.length) {
    const ids = nv.filter(itm => itm.enabled).map(itm => itm.id)
    result.added(...ids)
  }
  if (ov.length) {
    const ids = nv.map(itm => itm.id)
    result.removed(...ids)
  }
  result.added = result.added.map(id => newVal.find(itm => itm.id === id))
  result.updated = result.updated.map(id => newVal.find(itm => itm.id === id))
  return result
}

/**
 * when menuitems config changed
 * @param {Array} newVal new menuitems
 * @param {Array} oldVal old menuitems
 */
function onChange (newVal, oldVal) {
  // all menu has been removed
  if (!newVal || !newVal.length) {
    removeAll()
    return
  }
  if (!oldVal || !oldVal.length) {
    toggle(true)
    return
  }
  const result = diff(newVal, oldVal)
  result.removed.forEach(remove)
  result.added.forEach(addMenu)
  result.updated.forEach(updateMenu)
}

function toggle (isOn) {
  chrome.contextMenus.onClicked.removeListener(onMenuClick)
  if (isOn) {
    const menuItems = []
    menuItems.forEach(addMenu)
    chrome.contextMenus.onClicked.addListener(onMenuClick)
  } else {
    removeAll()
  }
  updateCache(isOn)
  this.enabled = isOn
}

function onMenuClick (info, tab) {
  const data = {
    time: Date.now(),
    type: info.menuItemId
  }
  switch (info.menuItemId) {
    case 'media':
      data.content = info.srcUrl
      break
    case 'text':
      data.content = info.selectionText
      break
    case 'link':
      data.content = info.linkUrl
      break
    default:
      console.warn('not support menu item', info)
      return
  }
  if (!data.content) return
  menuActions.qrcode(data.content)
  // chrome.storage.local.set({ 'qr-menu': data })
  // console.log('qr-menu', data)
  // chrome.tabs.executeScript(tab.id, {
  //   file: '/content-scripts/qr.js',
  //   // execute js ASAP, make QR feature available even before page loaded
  //   runAt: 'document_start'
  // })
}

export default new RuleProcessor(
  'contextmenu',
  {
    toggle,
    onChange
  },
  true
)
