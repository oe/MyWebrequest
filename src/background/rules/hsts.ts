// import utils from '@/common/utils'
import { IRtHstsRule, IWebRequestRules } from '@/types/runtime-webrule'
const webrequests: IWebRequestRules<IRtHstsRule> = [
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