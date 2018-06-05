import utils from './utils'

function storeGet (key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, resp => {
      console.warn('get key', key, resp, chrome.runtime.lastError)
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError)
      key ? resolve(resp[key]) : resolve(resp)
    })
  })
}

function storeSet (key, val) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get({ [key]: val }, () => {
      console.warn('set key', key, val, chrome.runtime.lastError)
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError)
      resolve()
    })
  })
}

export default {
  async get (cat, key) {
    const defVal = utils.isUrlRuleType(cat) ? [] : {}
    let result = await storeGet(cat)
    result = result || defVal
    return typeof key === 'undefined' ? result : result[key]
  },
  async save (cat, key, val) {
    let data = key
    if (arguments.length === 3) {
      data = this.get(cat)
      data[key] = val
    }
    await storeSet(cat, data)
  },
  async getKey (key) {
    const result = await storeGet(key)
    return result
  },
  async setOnoff (type, val) {
    await this.save('onoff', type, !!val)
  },
  async getOnoff (type) {
    const result = await this.get('onoff', type)
    return result
  },
  async getConfig (type) {
    const result = this.get('config', type)
    return result
  },
  async setConfig (type, val) {
    await this.save('config', type, val)
  },
  async getRouter4Custom () {
    // ignore disabled
    let result = await this.get('custom')
    result = result.filter(itm => itm.enabled)
    return result.reduce((acc, cur) => {
      try {
        cur = utils.preprocessRouter(cur)
        acc[cur.url] = cur
      } catch (e) {
        console.error('custom rule invalid', cur, e)
      }
      return acc
    }, {})
  },
  async getExtensionData () {
    const result = await storeGet(null)
    return result
  },
  // get rules/config for background
  async getData4Bg (cat) {
    let result = await this.get(cat)
    if (!utils.isUrlRuleType(cat)) return result
    // ignore disabled
    result = result.filter(itm => itm.enabled)
    return result.map(itm => itm.url)
  }
}
