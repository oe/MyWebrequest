import utils from '@/common/utils'
import collection from '@/common/collection'
import common from './common'

const defaultRules = {
  urls: []
}
// cache data for frequently usage
let cachedRules = {}

// update cache
async function updateCache (isOn) {
  if (isOn) {
    cachedRules = await collection.getRouter4Custom()
  } else {
    cachedRules = {}
  }
}

const webrequests = [
  {
    fn (details) {
      let found = false
      // remove referer
      utils.removeHeaders(details.requestHeaders, 'User-Agent')
      for (const k in cachedRules) {
        if (
          cachedRules.hasOwnProperty(k) &&
          utils.isURLMatchPattern(details.url, k)
        ) {
          const v = cachedRules[k]
          if (utils.isURLMatchPattern(details.url, v)) {
            found = true
            details.requestHeaders.push({
              name: 'User-Agent',
              value: v.value
            })
            break
          }
        }
      }
      if (!found) {
        console.warn('can not found rule of UA for', details.url)
        return
      }
      return {
        requestHeaders: details.requestHeaders
      }
    },
    permit: ['requestHeaders', 'blocking'],
    on: 'onBeforeSendHeaders'
  }
]

async function getRule () {
  const rule = await common.getRule('ua', defaultRules)
  return rule
}

export default {
  getRule,
  updateCache,
  webrequests,
  defaultRules
}
