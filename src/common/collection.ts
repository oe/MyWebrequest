import { isUrlRuleType } from './utils'
// data version
const VER = '1.0'
const VER_KEY = 'version'




function storeGet (key: string, type = 'object') {
  const response = localStorage.getItem(key)
  switch (type) {
    case 'object':
      return response ? JSON.parse(response) : {}
    case 'array':
      return response ? JSON.parse(response) : []
    case 'number':
      return response ? Number(response) : 0
    case 'boolean':
      return response ? Boolean(JSON.parse(response)) : false
    // default string
    default:
      return response || ''
  }
}

function storeSet (key: string, val: any) {
  const value = typeof val === 'string' ? val : JSON.stringify(val)
  localStorage.setItem(key, value)
}

export default {
  isExtUpdate () {
    const result = storeGet(VER_KEY, 'string')
    return result === VER
  },
  setExtUp2Date () {
    storeSet(VER_KEY, VER)
  },
  get (cat: string, key?: string) {
    const type = isUrlRuleType(cat) ? 'array' : 'object'
    const result = storeGet(cat, type)
    // @ts-ignore
    return typeof key === 'undefined' ? result : result[key]
  },
  save (cat: string, key: string | any, val?: any) {
    let data = key
    if (arguments.length === 3) {
      data = this.get(cat)
      data[key] = val
    }
    storeSet(cat, data)
  },
  getKey (key: string, type = 'object') {
    const result = storeGet(key, type)
    return result
  },
  setOnoff (type: string, val: string) {
    this.save('onoff', type, !!val)
  },
  getOnoff (type: string) {
    const result = this.get('onoff', type)
    return result as boolean
  },
  getConfig (type: string) {
    const result = this.get('config', type)
    return result
  },
  setConfig (type: string, val: any) {
    this.save('config', type, val)
  }
  // getExtensionData () {
  //   const result = storeGet(null)
  //   return result
  // }
}
