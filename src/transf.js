var fs = require('fs')
var o = require('./_locales/zh_CN/messages.json')

var r = {}

for (var key in o) {
  if (o.hasOwnProperty(key)) {
    r[key] = o[key].message
  }
}

fs.writeFileSync('./zh_CN.json', JSON.stringify(r, null, 2))
