const EXTENSION_ID = 'AAAAA'

function sendMessage (evtName, ...args) {
  return new Promise((resolve, reject) => {
    const msg = { cmd: evtName, args }
    chrome.runtime.sendMessage(EXTENSION_ID, msg, resp => {
      if (resp && !resp.code) {
        resolve(resp.data)
      } else {
        reject(resp)
      }
    })
  })
}

// send message from webpage
export default {
  // return {version: 'xxx'} if installed, or undefined
  isInstalled () {
    return sendMessage('version')
  },
  installExtension () {
    const a = document.createElement('a')
    a.href = `https://chrome.google.com/webstore/detail/${EXTENSION_ID}`
    a.target = '_blank'
    a.click()
  },
  fetch (options) {
    return sendMessage('fetch', options)
  }
}
