// import utils from '@/common/utils'
import RuleProcessor, { removeHeaders } from './common'

const webrequests = [
  {
    fn (details) {
      const headers = details.requestHeaders
      // remove referer
      removeHeaders(headers, 'Referer')
      return {
        requestHeaders: headers
      }
    },
    permit: ['requestHeaders', 'blocking'],
    on: 'onBeforeSendHeaders'
  }
]

export default new RuleProcessor('hotlink', {
  webrequests
})
