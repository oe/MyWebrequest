/** custom url redirect rule */
export interface IRedirectRule {
  cmd: 'redirect'
  /** chrome match url pattern */
  url: string
  /** if true matchUrl should be a valid reg string */
  useReg: false
  /** url input match pattern */
  matchUrl: string
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
  cmd: 'hsts'
  url: string
}

/** block connect */
export interface IBlockRule {
  cmd: 'block'
  url: string
}

/** no referer  */
export interface IReferrerRule {
  cmd: 'referer'
  /**
   * out: for remove referrer from the url
   * in: for remove referrer to the url
   * */
  type: 'out' | 'in'
  url: string
}

/** remove exist header(can use in hotlink) */
export interface IDeleteHeaderRule {
  cmd: 'header'
  url: string
  type: 'delete'
  name: string
}

/** change exist header(set a new header if not exist) */
export interface IUpdateHeaderRule {
  cmd: 'header'
  url: string
  type: 'update'
  name: string
  val: string
}

export type IAlterHeaderRule = IDeleteHeaderRule | IUpdateHeaderRule

/** allow cors request */
export interface ICorsRule {
  cmd: 'cors'
  /**
   * out: for allow cors from the url
   * in: for allow cors to the url
   * */
  type: 'out' | 'in'
  url: string
}

/** log the request info to the url */
export interface ILogRule {
  cmd: 'log'
  url: string
}

export type IWebRule =
  ILogRule |
  ICorsRule |
  IAlterHeaderRule |
  IBlockRule |
  IHstsRule |
  IRedirectRule |
  IReferrerRule


export interface IRuleConfig {
  rules: IWebRule[]
  enabled: boolean
  isValid: boolean
  createdAt: number
  updatedAt: number
}

type Foo<T extends { a: any, b: any }> = T["a"] | T["b"];

export interface IWebRequestRule<T extends IWebRule> {
  fn: (details: chrome.webRequest.WebRequestHeadersDetails, rule: T) => any,
  permit: string[]
  on: string
}

export type IWebRequestRules<T extends IWebRule> = IWebRequestRule<T>[]