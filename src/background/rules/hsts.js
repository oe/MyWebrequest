// import utils from '@/common/utils'
import common from './common'

const defaultRules = {
  urls: []
}

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

async function getRule () {
  const rule = await common.getRule('hsts', defaultRules)
  return rule
}

export default {
  getRule,
  webrequests,
  defaultRules
}
