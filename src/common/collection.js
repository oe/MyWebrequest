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
  // get rules for background
  get4Bg (cat) {
    let result = this.get(cat)
    if (!utils.isUrlRuleType(cat)) return result
    // ignore disabled
    result = result.filter(itm => itm.enabled)
    // for custom rules
    if (cat === 'custom') {
      return result.reduce((acc, cur) => {
        delete cur.createdAt
        delete cur.updatedAt
        acc[cur.url] = cur
      }, {})
    } else {
      return result.map(itm => itm.url)
    }
  }
}
