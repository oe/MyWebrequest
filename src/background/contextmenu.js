// urls protocols starts with http, https, file & ftp
//    protocols chrome, chrome-extension and so on wont match
const ALL_URL_PTTRNS = [
  '*://*/*',
  'file://*/*',
  'ftp://*/*'
]

// add context menu
function add (menuItems) {
  console.warn('add menu')
  // for selected text
  chrome.contextMenus.create({
    id: 'text',
    title: chrome.i18n.getMessage('menuTextTitle'),
    type: 'normal',
    contexts: ['selection'],
    documentUrlPatterns: ALL_URL_PTTRNS
    // documentUrlPatterns: ['http://*/*', 'https://*/*']
  })

  // for a tag
  chrome.contextMenus.create({
    id: 'link',
    title: chrome.i18n.getMessage('menuLinkTitle'),
    type: 'normal',
    contexts: ['link'],
    documentUrlPatterns: ALL_URL_PTTRNS
    // documentUrlPatterns: ['http://*/*', 'https://*/*']
  })

  // for image, video, audio
  chrome.contextMenus.create({
    id: 'media',
    title: chrome.i18n.getMessage('menuMediaTitle'),
    type: 'normal',
    contexts: ['image', 'video', 'audio'],
    documentUrlPatterns: ALL_URL_PTTRNS
    // documentUrlPatterns: ['http://*/*', 'https://*/*']
  })

  chrome.contextMenus.onClicked.addListener(onMenuClick)
}

// remove all context menu
function removeAll () {
  console.warn('remove menu')
  chrome.contextMenus.removeAll()
}

function remove (ids) {
  if (!Array.isArray(ids)) ids = [ids]
  ids.forEach(id => chrome.contextMenus.remove(id))
}

function update (id, newConfig) {
  chrome.contextMenus.remove(id)
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
  chrome.storage.local.set({ 'qr-menu': data })
  console.log('qr-menu', data)
  chrome.tabs.executeScript(tab.id, {
    file: '/content-scripts/qr.js',
    // execute js ASAP, make QR feature available even before page loaded
    runAt: 'document_start'
  })
}

export default {
  add,
  remove,
  update,
  removeAll
}
