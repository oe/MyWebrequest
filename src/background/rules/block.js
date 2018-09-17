import common from './common'

const defaultRules = {
  urls: []
}

const webrequests = [
  {
    fn (details) {
      console.warn('block url: ' + details.url)
      return {
        cancel: true
      }
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  }
]

async function getRule () {
  const rule = await common.getRule('block', defaultRules)
  return rule
}

export default {
  getRule,
  webrequests,
  defaultRules
}
