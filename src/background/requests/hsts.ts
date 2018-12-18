import { IHstsRule, IWebRequestRules } from '@/types/requests'
const webrequests: IWebRequestRules<IHstsRule> = [
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

export default webrequests