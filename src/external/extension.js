// webpage cmd handler
const handlers = {
  version () {
    const manifest = chrome.runtime.getManifest()
    return {
      version: manifest.version
    }
  },
  async fetch (options) {
    const resp = await fetch(options)
    return resp
  }
}

async function onExternalMessage (msg, sender, sendResponse) {
  try {
    const { cmd, args } = msg
    if (!handlers[cmd]) throw new Error(`can not find handler for ${cmd}`)
    const resp = await handlers[cmd](...args)
    sendResponse({
      code: 0,
      data: resp
    })
  } catch (e) {
    console.error('onExternalMessage', e)
    sendResponse({
      code: e.code || 500,
      message: e.message
    })
  }
  return true
}
// listen message send from webpage
chrome.runtime.onMessageExternal.addListener(onExternalMessage)
