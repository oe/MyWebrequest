import utils from './utils'

export default {
  get (cat, key) {
    const defVal = utils.isUrlRuleType(cat) ? [] : {}
    const result = JSON.parse(localStorage.getItem(cat)) || defVal
    return typeof key === 'undefined' ? result : result[key]
  },
  save (cat, key, val) {
    let data = key
    if (arguments.length === 3) {
      data = this.get(cat)
      data[key] = val
    }
    localStorage.setItem(cat, JSON.stringify(data))
  },
  getKey (key) {
    return localStorage.getItem(key)
  },
  setOnoff (type, val) {
    this.save('onoff', type, !!val)
  },
  getOnoff (type) {
    return this.get('onoff', type)
  },
  getConfig (type) {
    return this.get('config', type)
  },
  setConfig (type, val) {
    this.save('config', type, val)
  },
  getRouter4Custom () {
    // ignore disabled
    const result = this.get('custom').filter(itm => itm.enabled)
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
  getExtensionData () {
    return Object.keys(localStorage).reduce((acc, key) => {
      try {
        acc[key] = JSON.parse(localStorage.getItem(key))
      } catch (e) {
        acc[key] = localStorage.getItem(key)
      }
      return acc
    }, {})
  },
  // get rules/config for background
  getData4Bg (cat) {
    let result = this.get(cat)
    if (!utils.isUrlRuleType(cat)) return result
    // ignore disabled
    result = result.filter(itm => itm.enabled)
    return result.map(itm => itm.url)
  }
}
