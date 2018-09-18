import utils from '@/common/utils'
import collection from '@/common/collection'
import RuleProcessor, { isRuleEnabled } from './common'

// cache data for frequently usage
let cachedRules = []

// update cache
async function updateCache (isOn) {
  if (isOn) {
    // ignore disabled
    let result = await collection.get('custom')
    result = result.filter(isRuleEnabled)
    cachedRules = result
      .map(item => {
        try {
          return utils.preprocessRouter(item)
        } catch (e) {
          console.error('custom rule invalid', item, e)
        }
      })
      .filter(item => !!item)
  } else {
    cachedRules = []
  }
}

const webrequests = [
  {
    fn (details) {
      const url = details.url
      let len = cachedRules.length
      while (len--) {
        const targetUrl = utils.getTargetUrl(cachedRules[len], details.url)
        if (targetUrl) {
          console.log(
            `${url} target url is ${targetUrl}, with rule`,
            cachedRules[len]
          )
          return {
            redirectUrl: targetUrl
          }
        }
      }
      console.log('can not find targe url for', url)
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
