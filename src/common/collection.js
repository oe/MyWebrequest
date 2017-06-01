export default {
  getRules (cat, type = 'array') {
    return JSON.parse(localStorage.getItem(cat)) || (type === 'array' ? [] : {})
  },
  save (key, data) {
    localStorage.setItem(key, JSON.stringify(data))
  }
}
