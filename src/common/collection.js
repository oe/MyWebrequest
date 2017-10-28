const arrType = ['block', 'hsts', 'hotlink', 'log', 'custom']

export default {
  getRules (cat) {
    const defVal = arrType.indexOf(cat) === -1 ? {} : []
    return JSON.parse(localStorage.getItem(cat)) || defVal
  },
  save (key, data) {
    localStorage.setItem(key, JSON.stringify(data))
  }
}
