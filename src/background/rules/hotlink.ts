import { removeHeaders } from '@/background/utils'
import { IReferrerRule, IWebRequestRules } from '@/types/web-rule'

const webrequests: IWebRequestRules<IReferrerRule> = [
  {
    fn (details) {
      const headers = details.requestHeaders
      // remove referer
      removeHeaders(headers || [], 'Referer')
      return {
        requestHeaders: headers
      }
    },
    permit: ['requestHeaders', 'blocking'],
    on: 'onBeforeSendHeaders'
  }
]

export default webrequests
