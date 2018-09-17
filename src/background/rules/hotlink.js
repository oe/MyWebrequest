import utils from '@/common/utils'
import common from './common'

const defaultRules = {
  urls: []
}

const webrequests = [
  {
    fn (details) {
      const headers = details.requestHeaders
      // remove referer
      utils.removeHeaders(headers, 'Referer')
      return {
        requestHeaders: headers
      }
    },
    permit: ['requestHeaders', 'blocking'],
    on: 'onBeforeSendHeaders'
  }
]

async function getRule () {
  const rule = await common.getRule('hotlink', defaultRules)
  return rule
}

export default {
  getRule,
  webrequests,
  defaultRules
}
