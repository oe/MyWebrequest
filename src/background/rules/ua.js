import utils from '@/common/utils'
import collection from '@/common/collection'
import RuleProcessor, { removeHeaders, isRuleEnabled } from './common'

// cache data for frequently usage
let cachedRules = []

// update cache
async function updateCache (isOn) {
  if (isOn) {
    // ignore disabled
    let result = await collection.get('ua')
    cachedRules = result.filter(isRuleEnabled).map(item => ({
      url: item.url,
      ua: item.ua
    }))
  } else {
    cachedRules = []
  }
}

const webrequests = [
  {
    fn (details) {
      // remove referer
      removeHeaders(details.requestHeaders, 'User-Agent')
      const url = details.url
      const matched = cachedRules.find(itm =>
        utils.isURLMatchPattern(url, itm.url)
      )
      if (!matched) {
        console.warn('can not found rule of UA for', details.url)
        return
      }
      details.requestHeaders.push({
        name: 'User-Agent',
        value: matched.ua
      })

      return {
        requestHeaders: details.requestHeaders
      }
    },
    permit: ['requestHeaders', 'blocking'],
    on: 'onBeforeSendHeaders'
  }
]

export default new RuleProcessor('ua', {
  webrequests,
  async toggle (isOn) {
    const rule = await this._getRule()
    this._toggleWebRequest(rule, isOn)
    await updateCache(isOn)
  }
})
