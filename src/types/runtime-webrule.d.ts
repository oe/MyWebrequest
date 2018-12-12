import { IBlockRule, ICorsRule, IHstsRule, ILogRule, IRedirectRule } from './web-rule'
interface ICommonInfo {
  /** chrome match url pattern */
  reg: RegExp
  /** if true matchUrl should be a valid reg string */
  useReg?: false
  /** url input match pattern */
  matchUrl?: string
}

interface IHeaderRuleItem {
  type: 'delete' | 'update'
  name: string
  val?: string
}

export interface IRtHeaderRule extends ICommonInfo {
  rules: IHeaderRuleItem[]
}

export type IRtBlockRule = ICommonInfo & IBlockRule

export type IRtCorsRule = ICommonInfo & ICorsRule
export type IRtHstsRule = ICommonInfo & IHstsRule
export type IRtLogRule = ICommonInfo & ILogRule
export type IRtRedirectRule = ICommonInfo & IRedirectRule

export type IRtRule =
  IRtHeaderRule |
  IRtBlockRule |
  IRtCorsRule |
  IRtHstsRule |
  IRtLogRule |
  IRtRedirectRule

export interface IWebRequestRule<T extends IRtRule, K extends chrome.webRequest.ResourceRequest> {
  fn: (details: K, rule: T) => any,
  permit: string[]
  on: string
}


export type IWebRequestRules<T extends IRtRule, K extends chrome.webRequest.ResourceRequest = chrome.webRequest.WebRequestHeadersDetails> = IWebRequestRule<T, K>[]