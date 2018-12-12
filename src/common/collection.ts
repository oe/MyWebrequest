import { isUrlRuleType } from './utils'
// data version
const VER = '1.0'
const VER_KEY = 'version'

function storeGet (key: string | null) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, resp => {
      // console.warn('get key', key, resp, chrome.runtime.lastError)
      if (chrome.runtime.lastError) return reject(chrome.runtime.lastError)
      key ? resolve(resp[key]) : resolve(resp)
    })
  })
}

function storeSet (key: string, val: any) {
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
    const result = await storeGet(VER_KEY)
    return result === VER
  },
  async setExtUp2Date () {
    await storeSet(VER_KEY, VER)
  },
  async get (cat: string, key?: string) {
    const defVal = isUrlRuleType(cat) ? [] : {}
    let result = await storeGet(cat)
    result = result || defVal
    // @ts-ignore
    return typeof key === 'undefined' ? result : result[key]
  },
  async save (cat: string, key: string | any, val?: any) {
    let data = key
    if (arguments.length === 3) {
      data = await this.get(cat)
      data[key] = val
    }
    await storeSet(cat, data)
  },
  async getKey (key: string) {
    const result = await storeGet(key)
    return result
  },
  async setOnoff (type: string, val: string) {
    await this.save('onoff', type, !!val)
  },
  async getOnoff (type: string) {
    const result = await this.get('onoff', type)
    return result as boolean
  },
  async getConfig (type: string) {
    const result = await this.get('config', type)
    return result
  },
  async setConfig (type: string, val: any) {
    await this.save('config', type, val)
  },
  async getExtensionData () {
    const result = await storeGet(null)
    return result
  }
}
