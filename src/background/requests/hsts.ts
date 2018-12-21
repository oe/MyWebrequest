import { IHstsRule, IWebRequestRules } from '@/types/requests'
const webrequests: IWebRequestRules<IHstsRule> = [
  {
    fn (result, details) {
      result.redirectUrl = details.url.replace(/^http:\/\//, 'https://')
      return result
    },
    permit: ['blocking'],
    on: 'onBeforeRequest'
  }
]

export default webrequests