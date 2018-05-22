function createMenu () {
  chrome.contextMenus.create({
    id: 'selection',
    title: 'Get QRCode of Selected Text',
    type: 'normal',
    contexts: ['selection']
  })

  chrome.contextMenus.create({
    id: 'link',
    title: 'Get QRCode of Link',
    type: 'normal',
    contexts: ['link']
  })

  chrome.contextMenus.onClicked.addListener(onMenuClick)
}

function onMenuClick (info, tab) {
  const data = {
    time: Date.now(),
    type: info.menuItemId
  }
  if (info.menuItemId === 'selection') {
    data.content = info.selectionText
  } else if (info.menuItemId === 'link') {
    data.content = info.linkUrl
  }
  if (!data.content) return
  chrome.storage.local.set({ 'qr-popup': data })
  console.log('qr-popup', data)
  chrome.tabs.executeScript(tab.id, {
    file: '/content-scripts/qr.js'
  })
}

createMenu()
