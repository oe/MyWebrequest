import { IWebRequestRules, IRtHeaderRule } from '@/types/requests'
import { alterHeaders } from '@/background/requests/utils'

const webrequests: IWebRequestRules<IRtHeaderRule> = [
  {
    fn (result, details, rule) {
      const headers = result.requestHeaders || details.requestHeaders || []
      rule.rules.forEach((item) => {
        alterHeaders(headers, item.name, item.val)
      })
      return {
        requestHeaders: headers
      }
    },
    permit: ['requestHeaders', 'blocking'],
    on: 'onBeforeSendHeaders'
  }
]

export default webrequests

