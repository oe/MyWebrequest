export default {
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
  })()
}
