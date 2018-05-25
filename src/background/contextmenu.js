// add context menu
function addMenu () {
  console.warn('add menu')
  // for selected text
  chrome.contextMenus.create({
    id: 'text',
    title: 'Get QRCode of Selected Text',
    type: 'normal',
    contexts: ['selection'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  })

  // for a tag
  chrome.contextMenus.create({
    id: 'link',
    title: 'Get QRCode of Link',
    type: 'normal',
    contexts: ['link'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  })

  // for image, video, audio
  chrome.contextMenus.create({
    id: 'media',
    title: 'Get QRCode of Media',
    type: 'normal',
    contexts: ['image', 'video', 'audio'],
    documentUrlPatterns: ['http://*/*', 'https://*/*']
  })

  chrome.contextMenus.onClicked.addListener(onMenuClick)
}

// remove all context menu
function removeMenu () {
  console.warn('remove menu')
  chrome.contextMenus.removeAll()
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
    file: '/content-scripts/qr.js'
  })
}

export default {
  addMenu,
  removeMenu
}
