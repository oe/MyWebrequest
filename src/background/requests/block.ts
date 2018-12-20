import { IBlockRule, IWebRequestRules } from '@/types/requests'

const webrequests: IWebRequestRules<IBlockRule> = [
  {
    fn (result, details) {
      console.warn('block url: ' + details.url)
      // @ts-ignore
      result.cancel = true
      return result
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  }
]

export default webrequests

