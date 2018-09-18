// import utils from '@/common/utils'
import RuleProcessor from './common'

const webrequests = [
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

export default new RuleProcessor('hsts', {
  webrequests
})
