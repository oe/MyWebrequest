export const enum EWebRuleType {
  /** redirect url */
  REDIRECT = 'REDIRECT',
  /** enforece https connection */
  HSTS = 'HSTS',
  /** block url */
  BLOCK = 'BLOCK',
  /** alter header */
  HEADER = 'HEADER',
  /** Referrer & UA actually belong to  header, change referrer */
  REFERRER = 'REFERRER',
  /** remmove refer of request from matched url */
  REFERRER_OUT = 'REFERRER_OUT',
  /** change user-agent */
  UA = 'UA',
  /** change UA of request from matched url  */
  UA_OUT = 'UA_OUT',
  /** allow cross origin request to matched url */
  CORS = 'CORS',
  /** allow cross origin request from matched url */
  CORS_OUT = 'CORS_OUT',
  /** log webrequest */
  LOG = 'LOG',
  /** inject css/js to webpage */
  INJECT = 'INJECT'
}

type ERuleTypeKeys = keyof typeof EWebRuleType

/** custom url redirect rule */
export interface IRedirectRule {
  cmd: EWebRuleType.REDIRECT

  /** redirect to url pattern */
  redirectUrl: string
  /** reg string can match the source url */
  reg: string
  /**
   * false for no wildcard param
   * string for wildcard reg string
   */
  wildcard: false | string
  /**
   * false for no params
   * array for exist params in path
   */
  params: false | string[]
  /**
   * false for no querystring params
   * object for exist param in querystring
   */
  qsParams: false | { [k: string]: string }
}

/** redirect enforece https connect  */
export interface IHstsRule {
  cmd: EWebRuleType.HSTS
}

/** block connect */
export interface IBlockRule {
  cmd: EWebRuleType.BLOCK
}

/** no referer  */
export interface IReferrerRule {
  cmd: EWebRuleType.REFERRER
}

export interface IReferrerOutRule {
  cmd: EWebRuleType.REFERRER_OUT
}

/** remove exist header(can use in hotlink) */
export interface IDeleteHeaderRule {
  type: 'delete'
  /** header name to delete */
  name: string
}

/** change exist header(set a new header if not exist) */
export interface IUpdateHeaderRule {
  type: 'update'
  /** header name that value need be changed */
  name: string
  /** dest value */
  val: string
}

export type IAlterHeaderItem = IDeleteHeaderRule | IUpdateHeaderRule

export interface IHeaderRule {
  cmd: EWebRuleType.HEADER
  rules: (IDeleteHeaderRule | IUpdateHeaderRule)[]
}

/** allow cors request to the matched url */
export interface ICorsRule {
  cmd: EWebRuleType.CORS

}

/** allow cors request from the matched url*/
export interface ICorsOutRule {
  cmd: EWebRuleType.CORS_OUT
}

/** change ua to the match url */
export interface IUaRule {
  cmd: EWebRuleType.UA
  /** ua want to change */
  ua: string
}

/** change ua from the match url */
export interface IUaOutRule {
  cmd: EWebRuleType.UA_OUT
  /** ua want to change */
  ua: string
}

/** log the request info to the url */
export interface ILogRule {
  cmd: EWebRuleType.LOG
}

export interface IInjectScript {
  /** inject type is css / javascript */
  type: 'css' | 'js'
  /** code content */
  code?: string
  /** remote file urls */
  file?: string
  // when to run
  runtAt: 'document_start' | 'document_end' | 'document_idle'
}
/** inject css/js to webpage */
export interface IInjectRule {
  cmd: EWebRuleType.INJECT
  rules: IInjectScript[]
}
/** all request rule type */
export type IWebRule =
  /** redirect url */
  IRedirectRule
  /** enforece https connection */
  | IHstsRule
  /** block url */
  | IBlockRule
  /** alter header */
  | IHeaderRule
  /** Referrer & UA actually belong to  header, change referrer */
  | IReferrerRule
  /** remmove refer of request from matched url */
  | IReferrerOutRule
  /** change user-agent */
  | IUaRule
  /** change UA of request from matched url  */
  | IUaOutRule
  /** allow cross origin request to matched url */
  | ICorsRule
  /** allow cross origin request from matched url */
  | ICorsOutRule
  /** log webrequest */
  | ILogRule
  /** inject css/js to webpage */
  | IInjectRule

/** all request rule use in runtime */
export type IRtWebRule =
  /** redirect url */
  IRedirectRule
  /** enforece https connection */
  | IHstsRule
  /** block url */
  | IBlockRule
  /** alter header */
  | IHeaderRule
  /** allow cross origin request to matched url */
  | ICorsRule
  /** log webrequest */
  | ILogRule

/** all request rules in a single config */
export interface IRequestRules {
  /** redirect url */
  REDIRECT: IRedirectRule
  /** enforece https connection */
  HSTS: IHstsRule
  /** block url */
  BLOCK: IBlockRule
  /** alter header */
  HEADER: IHeaderRule
  /** Referrer & UA actually belong to  header, change referrer */
  REFERRER: IReferrerRule
  /** remmove refer of request from matched url */
  REFERRER_OUT: IReferrerOutRule
  /** change user-agent */
  UA: IUaRule
  /** change UA of request from matched url  */
  UA_OUT: IUaOutRule
  /** allow cross origin request to matched url */
  CORS: ICorsRule
  /** allow cross origin request from matched url */
  CORS_OUT: ICorsOutRule
  /** log webrequest */
  LOG: ILogRule
  /** inject css/js to webpage */
  INJECT: IInjectRule
}

/** a single request config for storage */
export interface IRequestConfig {
  /** rule id, auto-generated */
  id: string
  rules: Partial<IRequestRules>
  /** chrome match url pattern */
  url: string
  /** if true matchUrl should be a valid reg string */
  useReg: boolean
  /** url input match pattern */
  matchUrl: string
  enabled: boolean
  isValid: boolean
  createdAt: number
  updatedAt: number
}

/** rules in use on runtime */
export type IRtRequestRule = Pick<Partial<IRequestRules>, Exclude<ERuleTypeKeys, 'INJECT' | 'CORS_OUT' | 'UA_OUT' | 'UA' | 'REFERRER_OUT' | 'REFERRER'>>

/** a single request config for runtime */
export interface IRtRequestConfig {
  id: string
  reg: RegExp
  url: string
  useReg: boolean
  matchUrl: string
  rules: IRtRequestRule
}

export interface IUaInfo {
  ua: string
}

export interface IRequestListenerResult {
  cancel?: boolean
  requestHeaders?: chrome.webRequest.HttpHeader[]
  responseHeaders?: chrome.webRequest.HttpHeader[]
  redirectUrl?: string
  [k: string]: any
}

export interface IWebRequestRule<T extends IRtWebRule, K extends chrome.webRequest.ResourceRequest> {
  fn: (result: IRequestListenerResult, details: K, rule: T, config: IRtRequestConfig) => any,
  permit: string[]
  on: string
}


export type IWebRequestRules<T extends IRtWebRule, K extends chrome.webRequest.ResourceRequest = chrome.webRequest.WebRequestHeadersDetails> = IWebRequestRule<T, K>[]


export interface IRequestCacheItem {
  /** is the event listener on */
  isOn: boolean
  /** permission that need to declare for chrome  */
  permit: string[]
  /** chrome webrequest event name */
  evtName: string
  /** rule types (LOG, HSTS, HEADER, etc...) that need this event listener */
  ruleTypes: EWebRuleType[]
  /** event callbacks */
  fns: ({ type: EWebRuleType, fn: Function })[]
  /** cached user rule configs */
  rules: IRtRequestConfig[]
  /** chrome event listener to run the callbacks */
  chromeRequestListener: Function
}

/** chrome event & event config map */
export interface IRequestCache {
  // k should be in WEB_REQUEST_EVENT_FLOW, aka chrome webrequest event name
  [k: string]: IRequestCacheItem
}