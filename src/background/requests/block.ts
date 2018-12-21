import { IBlockRule, IWebRequestRules } from '@/types/requests'

const webrequests: IWebRequestRules<IBlockRule> = [
  {
    fn (result, details) {
      console.warn('block url: ' + details.url)
      result.cancel = true
      return result
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  }
]

export default webrequests

