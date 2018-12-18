import { preprocessRouter, getTargetUrl } from '@/common/utils'
import collection from '@/common/collection'
import { EWebRuleType, IRedirectRule, IWebRequestRules } from '@/types/requests'


// cache data for frequently usage
let cachedRules: any[] = []

// update cache
async function updateCache (isOn: boolean) {
  if (isOn) {
    // ignore disabled
    const result = await collection.get(EWebRuleType.REDIRECT) as IRedirectRule[]
    cachedRules = result
      .map(item => {
        try {
          return preprocessRouter(item)
        } catch (e) {
          console.error('custom rule invalid', item, e)
        }
      })
      .filter(item => !!item)
  } else {
    cachedRules = []
  }
}

const webrequests: IWebRequestRules<IRedirectRule> = [
  {
    fn (details) {
      const url = details.url
      let len = cachedRules.length
      while (len--) {
        const targetUrl = getTargetUrl(cachedRules[len], details.url)
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
      return
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  }
]

export default webrequests

