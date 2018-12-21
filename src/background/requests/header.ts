import { IWebRequestRules, IHeaderRule } from '@/types/requests'
import { alterHeaders } from '@/background/requests/utils'

const webrequests: IWebRequestRules<IHeaderRule> = [
  {
    fn (result, details, rule) {
      const headers = result.requestHeaders || details.requestHeaders || []
      rule.rules.forEach((item) => {
        if (item.type === 'delete') {
          alterHeaders(headers, item.name)
        } else {
          alterHeaders(headers, item.name, item.val)
        }
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

