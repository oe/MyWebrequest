export default {
  getRules (cat) {
    return cat ? JSON.parse(localStorage.getItem(cat)) || [] : []
  },
  save (cat, data) {
    localStorage.setItem(cat, JSON.stringify(data))
  }
}
