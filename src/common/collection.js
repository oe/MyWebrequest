import utils from './utils'

export default {
  get (cat) {
    const defVal = utils.isUrlRuleType(cat) ? [] : {}
    return JSON.parse(localStorage.getItem(cat)) || defVal
  },
  save (key, data) {
    localStorage.setItem(key, JSON.stringify(data))
  },
  getKey (key) {
    return localStorage.getItem(key)
  },
  setOnoff (type, val) {
    const onoff = this.get('onoff')
    onoff[type] = !!val
    this.save('onoff', onoff)
  },
  getOnoff (type) {
    const onoff = this.get('onoff')
    return onoff[type]
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
  // get rules/config for background
  getData4Bg (cat) {
    let result = this.get(cat)
    if (!utils.isUrlRuleType(cat)) return result
    // ignore disabled
    result = result.filter(itm => itm.enabled)
    return result.map(itm => itm.url)
  }
}
