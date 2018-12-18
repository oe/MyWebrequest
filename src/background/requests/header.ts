import { IWebRequestRules, IRtHeaderRule } from '@/types/requests'
import { alterHeaders } from '@/background/utils'

const webrequests: IWebRequestRules<IRtHeaderRule> = [
  {
    fn (details, rule) {
      const headers = details.requestHeaders || []
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

