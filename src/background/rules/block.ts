import { IBlockRule, IWebRequestRules } from '@/types/web-rule'

const webrequests: IWebRequestRules<IBlockRule> = [
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

