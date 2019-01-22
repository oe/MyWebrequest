import collection from '@/common/collection'
import * as cutils from '@/common/utils'
import validate from './validate'

function migrateSimpleRules () {
  const simpleRules = ['block', 'hsts', 'hotlink', 'log']
  for (let i = 0; i < simpleRules.length; i++) {
    const key = simpleRules[i]
    let rules
    try {
      rules = JSON.parse(localStorage.getItem(key) || 'null')
    } catch (e) {
      console.warn(`[migrate]failed to parse rules of {key}, skipped`, e)
    }
    if (!Array.isArray(rules)) rules = []
    // no rules
    if (!rules.length) continue
    rules = rules.map(item => {
      let valid = false
      try {
        validate.checkChromeRule(item.url)
        valid = true
      } catch (e) {
        console.log(`${key} rule ${item} is invalid`, e)
      }
      return {
        url: item,
        valid,
        id: cutils.guid(),
        enabled: valid && true,
        createdAt: 0,
        updatedAt: 0
      }
    })
    collection.save(key, rules)
  }
}

function migrateCustomRules () {
  // @ts-ignore
  let rules
  try {
    rules = JSON.parse(localStorage.getItem('custom') || 'null')
  } catch (e) {
    console.warn(`[migrate]failed to parse custom rules`, e)
  }
  if (!rules || typeof rules !== 'object') {
    console.warn('[migrate]custom rules is invalid, skipped')
    return
  }
  const keys = Object.keys(rules)
  // no rules
  if (!keys.length) return
  // @ts-ignore
  const ruleArr = keys.map(key => rules[key])
  console.log('rulesArr...', ruleArr)
}

function migrateOthers () {
  const otherKeys = ['config', 'onoff']
  for (let i = 0; i < otherKeys.length; i++) {
    const key = otherKeys[i]
    let config
    try {
      config = JSON.parse(localStorage.getItem(key) || 'null')
    } catch (e) {
      console.warn(`[migrate]failed to parse settings of ${key}`, e)
    }
    if (!config || typeof config !== 'object') {
      console.warn('[migrate]custom rules is invalid, skipped')
      continue
    }
    collection.save(key, config)
  }
}

function migrate () {
  console.warn('[migrate]start to migrate')
  migrateSimpleRules()
  // transfrom custom rules to array, and add `active` prop
  migrateCustomRules()
  migrateOthers()
  console.warn('[migrate]migrate done')
}

export default function () {
  try {
    const isUp2data = collection.isExtUpdate()
    if (isUp2data) {
      console.info('[migrate] no need to migrate')
      return
    }
    migrate()
    collection.setExtUp2Date()
  } catch (e) {
    console.error('[migrate]failed to migrate old data from localStorage', e)
  }
}
