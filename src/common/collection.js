import utils from './utils'
const arrType = ['block', 'hsts', 'hotlink', 'log', 'custom']

export default {
  get (cat) {
    const defVal = utils.inArray(arrType, cat) ? [] : {}
    return JSON.parse(localStorage.getItem(cat)) || defVal
  },
  save (key, data) {
    localStorage.setItem(key, JSON.stringify(data))
  },
  // get rules for background
  get4Bg (cat) {
    let result = this.get(cat)
    if (!utils.inArray(arrType, cat)) return result
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
