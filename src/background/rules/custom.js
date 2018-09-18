import utils from '@/common/utils'
import collection from '@/common/collection'
import RuleProcessor from './common'

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
      let k, rule, url
      const rules = cachedRules
      for (k in rules) {
        if (!rules.hasOwnProperty(k)) continue
        rule = rules[k]
        console.log('get target Url, rule: %o, url: %s', rule, details.url)
        url = utils.getTargetUrl(rule, details.url)
        console.log('then target url is: %s', url)
        if (url) {
          return {
            redirectUrl: url
          }
        }
      }
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  }
]

export default new RuleProcessor('custom', {
  webrequests,
  async toggle (isOn) {
    const rule = await this._getRule()
    this._toggleWebRequest(rule, isOn)
    await updateCache(isOn)
  }
})
