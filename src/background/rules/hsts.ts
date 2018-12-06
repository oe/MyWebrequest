// import utils from '@/common/utils'
import { IHstsRule, IWebRequestRules } from '@/types/web-rule'

const webrequests: IWebRequestRules<IHstsRule> = [
  {
    fn (details) {
      return {
        redirectUrl: details.url.replace(/^http:\/\//, 'https://')
      }
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  }
]

export default webrequests