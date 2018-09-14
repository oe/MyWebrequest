import collection from '@/common/collection'
import cutils from '@/common/utils'
import validate from './validate'

async function migrateSimpleRules () {
  const simpleRules = ['block', 'hsts', 'hotlink', 'log']
  for (let i = 0; i < simpleRules.length; i++) {
    const key = simpleRules[i]
    let rules
    try {
      rules = JSON.parse(localStorage.getItem(key))
    } catch (e) {
      console.warn(`[migrate]failed to parse rules of {key}, skipped`, e)
    }
    if (!Array.isArray(rules)) rules = []
    // no rules
    if (!rules.length) continue
    rules = rules.map(item => {
      let valid = false
      try {
        validate.checkChromeRule()
        valid = true
      } catch(e) {
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
    await collection.save(key, rules)
  }
}

async function migrateCustomRules () {
  let rules
  try {
    rules = JSON.parse(localStorage.getItem('custom'))
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
  const ruleArr = keys.map(key => rules[key])
  console.log('rulesArr...', ruleArr)
}

async function migrateOthers () {
  const otherKeys = ['config', 'onoff']
  for (let i = 0; i < otherKeys.length; i++) {
    const key = otherKeys[i]
    let config
    try {
      config = JSON.parse(localStorage.getItem(key))
    } catch (e) {
      console.warn(`[migrate]failed to parse settings of ${key}`, e)
    }
    if (!config || typeof config !== 'object') {
      console.warn('[migrate]custom rules is invalid, skipped')
      continue
    }
    await collection.save(key, config)
  }
}

async function migrate () {
  console.warn('[migrate]start to migrate')
  await migrateSimpleRules()
  // transfrom custom rules to array, and add `active` prop
  await migrateCustomRules()
  await migrateOthers()
  console.warn('[migrate]migrate done')
}

export default async function () {
  try {
    const isUp2data = await collection.isExtUpdate()
    if (isUp2data) {
      console.info('[migrate] no need to migrate')
      return
    }
    await migrate()
    await collection.setExtUp2Date()
  } catch (e) {
    console.error('[migrate]failed to migrate old data from localStorage', e)
  }
}
