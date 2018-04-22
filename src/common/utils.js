const arrType = ['block', 'hsts', 'hotlink', 'log', 'custom']

export default {
  isUrlRuleType (type) {
    return this.inArray(arrType, type)
  },
  inArray: (function () {
    if (Array.prototype.includes) {
      return function (arr, val) {
        return arr.includes(val)
      }
    } else {
      return function (arr, val) {
        return arr.indexOf(val) !== -1
      }
    }
  })(),
  findInArr: (function () {
    if (Array.prototype.find) {
      return function (arr, fn) {
        return arr.find(fn)
      }
    } else {
      return function (arr, fn) {
        const len = arr.length
        let i = 0
        while (i < len) {
          if (fn(arr[i], i, arr)) return arr[i]
          ++i
        }
      }
    }
  })()
}
