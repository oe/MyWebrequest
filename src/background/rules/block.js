import RuleProcessor from './common'

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

export default new RuleProcessor('block', {
  webrequests
})
