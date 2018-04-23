import collection from '@/common/collection'

// data version
const ver = '1.0'

const version = {
  key: 'data-version',
  get () {
    return localStorage.getItem(version.key) || ''
  },
  set (ver) {
    localStorage.setItem(version.key, ver)
  }
}

function migrateTo1 () {
  // add `active` prop
  const simpleRules = ['block', 'hsts', 'hotlink', 'log']
  simpleRules.forEach(key => {
    const rules = collection.getRules(key).map(item => {
      return {
        url: item,
        active: true
      }
    })
    collection.save(key, rules)
  })

  // transfrom custom rules to array, and add `active` prop
  const custom = 'custom'
  let rules = collection.getRules(custom)
  if (!Array.isArray(rules)) {
    rules = Object.keys(rules).map(key => {
      rules[key].active = true
      return rules[key]
    })
    collection.save(custom, rules)
  }
}

export default function migrate () {
  const curVer = version.get()
  if (ver === curVer) return
  migrateTo1()
  version.set(ver)
}
