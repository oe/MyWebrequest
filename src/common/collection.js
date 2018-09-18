import utils from './utils'
// data version
const VER = '1.0'
const VER_KEY = 'version'

function storeGet (key) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, resp => {
      // console.warn('get key', key, resp, chrome.runtime.lastError)
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError)
      key ? resolve(resp[key]) : resolve(resp)
    })
  })
}

function storeSet (key, val) {
  return new Promise((resolve, reject) => {
    // if (typeof val === 'object') val = JSON.parse(JSON.stringify(val))
    chrome.storage.sync.set({ [key]: val }, () => {
      console.warn('set key', key, val, chrome.runtime.lastError)
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError)
      resolve()
    })
  })
}

export default {
  async isExtUpdate () {
    let result = await storeGet(VER_KEY)
    return result === VER
  },
  async setExtUp2Date () {
    await storeSet(VER_KEY, VER)
  },
  async get (cat, key) {
    const defVal = utils.isUrlRuleType(cat) ? [] : {}
    let result = await storeGet(cat)
    result = result || defVal
    return typeof key === 'undefined' ? result : result[key]
  },
  async save (cat, key, val) {
    let data = key
    if (arguments.length === 3) {
      data = await this.get(cat)
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
    const result = await this.get('config', type)
    return result
  },
  async setConfig (type, val) {
    await this.save('config', type, val)
  },
  async getExtensionData () {
    const result = await storeGet(null)
    return result
  }
}
