import collection from '@/common/collection'

// data version
const ver = '1.0'

const version = {
  key: 'data-version',
  get() {
    return localStorage.getItem(version.key) || ''
  },
  set(ver) {
    localStorage.setItem(version.key, ver)
  }
}


const simpleRules = ['block', 'hsts', 'hotlink', 'log']

function migrateTo1() {
  simpleRules.forEach((key) => {
    const rules = collection.getRules(key).map((item) => {
      return {
        rule: item,
        active: true
      }
    })
    collection.save(key, rules)
  })

  const custom = 'custom'
  const rules = collection.getRules(custom, 'object')
  Object.keys(rules).forEach((key) => {
    rules[key].active = true
  })

  collection.save(custom, rules)
}

export default function migrate() {
  const curVer = version.get()
  if (ver === curVer) return
  migrateTo1()
  version.set(ver)
}
