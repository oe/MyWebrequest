import { IRtBlockRule, IWebRequestRules } from '@/types/runtime-webrule'

const webrequests: IWebRequestRules<IRtBlockRule> = [
  {
    fn (details, rule) {
      console.warn('block url: ' + details.url)
      return {
        cancel: true
      }
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  }
]

export default webrequests

