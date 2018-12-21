import REDIRECT from './redirect'
import CORS from './cors'
import HSTS from './hsts'
import BLOCK from './block'
import HEADER from './header'
import LOG from './log'
import onTabChange from './tab-change'
import { uniqueArray, convertPattern2Reg } from '@/common/utils'
import { isRuleEnabled, diffArray, IDiffArrayResult } from '@/background/requests/utils'
import { IRequestListenerResult, IWebRequestRule, IWebRule, IRequestConfig, EWebRuleType, IRtRequestConfig } from '@/types/requests'

const REQUESTS = {
  BLOCK,
  CORS,
  HEADER,
  HSTS,
  LOG,
  REDIRECT
}

const WEB_REQUEST_EVENT_FLOW = [
  /** synchronous, Fires when a request is about to occur. This event is sent before any TCP connection is made and can be used to cancel or redirect requests */
  'onBeforeRequest',
  /** synchronous, Fires when a request is about to occur and the initial headers have been prepared. The event is intended to allow extensions to add, modify, and delete request headers (*). */
  'onBeforeSendHeaders',
  /** Fires after all extensions have had a chance to modify the request headers, and presents the final (*) version. The event is triggered before the headers are sent to the network. This event is informational and handled asynchronously. It does not allow modifying or cancelling the request. */
  'onSendHeaders',
  /** synchronous, Fires each time that an HTTP(S) response header is received. Due to redirects and authentication requests this can happen multiple times per request. This event is intended to allow extensions to add, modify, and delete response headers, such as incoming Content-Type headers. The caching directives are processed before this event is triggered, so modifying headers such as Cache-Control has no influence on the browser's cache. It also allows you to cancel or redirect the request. */
  'onHeadersReceived',
  /** synchronous, Fires when a request requires authentication of the user. This event can be handled synchronously to provide authentication credentials. Note that extensions may provide invalid credentials. Take care not to enter an infinite loop by repeatedly providing invalid credentials. This can also be used to cancel the request. */
  'onAuthRequired',
  /** Fires when a redirect is about to be executed. A redirection can be triggered by an HTTP response code or by an extension. This event is informational and handled asynchronously. It does not allow you to modify or cancel the request. */
  'onBeforeRedirect',
  /** Fires when the first byte of the response body is received. For HTTP requests, this means that the status line and response headers are available. This event is informational and handled asynchronously. It does not allow modifying or cancelling the request. */
  'onResponseStarted',
  /** Fires when a request has been processed successfully. */
  'onCompleted',
  /** Fires when a request could not be processed successfully. */
  'onErrorOccurred'
]

interface IRequestCacheItem {
  permit: string[]
  fns: ({ type: string, fn: Function })[]
  rules: IRtRequestConfig[]
  chromeRequestListener: Function
}

interface IRequestCache {
  // k should be in WEB_REQUEST_EVENT_FLOW
  [k: string]: IRequestCacheItem
}

interface ITempRequestResult {
  [k: string]: IRtRequestConfig[]
}

const REQUEST_RULE_CACHE_DATA: IRequestCache = {}

function init () {
  const requestTypes = Object.keys(REQUESTS)
  WEB_REQUEST_EVENT_FLOW.forEach((evtName) => {
    requestTypes.forEach((type) => {
      // @ts-ignore
      let processors = REQUESTS[type] as IWebRequestRule<any, any>[]
      processors = processors.filter(item => item.on === evtName)
      if (!processors.length) return
      if (processors.length > 1) throw new Error(`${type} should have only one processor on event ${evtName}`)
      const processor = processors[0]
      // @ts-ignore
      const evtProcessor = REQUEST_RULE_CACHE_DATA[evtName] || (REQUEST_RULE_CACHE_DATA[evtName] = { permit: [], fns: [], rules: [] })
      evtProcessor.permit.push(...processor.permit)
      evtProcessor.fns.push({
        fn: processor.fn,
        type
      })
    })
  })
  Object.keys(REQUEST_RULE_CACHE_DATA).forEach((key) => {
    const processor = REQUEST_RULE_CACHE_DATA[key]
    processor.permit = uniqueArray(processor.permit)
    processor.chromeRequestListener = createRequestListener(key)
  })
}

init()

export function onRequestsChange (newVal: IRequestConfig[], oldVal?: IRequestConfig[]) {
  console.warn('newVal', newVal)
  const diffResult = diffArray(newVal.filter(isRuleEnabled), (oldVal || []).filter(isRuleEnabled), isEqual, isSame)
  onTabChange(diffResult)
  updateRequests(diffResult)
}

function isEqual (a: IRequestConfig, b: IRequestConfig) {
  // same id & chrome match url pattern not change
  return a.id === b.id && a.updatedAt === b.updatedAt
}

function isSame (a: IRequestConfig, b: IRequestConfig) {
  return a.id === b.id
}

function updateRequests (diffResult: IDiffArrayResult<IRequestConfig>) {
  const tempResult = Object.keys(REQUEST_RULE_CACHE_DATA).reduce((acc, cur) => {
    // shallow copy
    acc[cur] = REQUEST_RULE_CACHE_DATA[cur].rules.slice(0)
    return acc
  }, {} as ITempRequestResult)
  handleRemoved(tempResult, diffResult.removed)
  handleUpdated(tempResult, diffResult.updated)
  handleAdded(tempResult, diffResult.added)
}

function handleRemoved (result: ITempRequestResult, cfgs: IRequestConfig[]) {
  if (!cfgs.length) return result
  const newCfgs = analyzeConfigs(cfgs)
  newCfgs.forEach(cfg => {
    const id = cfg.id
    Object.keys(result).forEach(k => {
      const items = result[k]
      result[k] = items.filter(item => item.id !== id)
    })
  })
  return result
}
function handleUpdated (result: ITempRequestResult, cfgs: IRequestConfig[]) {
  if (!cfgs.length) return result
  const newCfgs = analyzeConfigs(cfgs)
  newCfgs.forEach(cfg => {
    const id = cfg.id
    Object.keys(result).forEach(k => {
      const items = result[k]
      result[k] = items.filter(item => item.id !== id)
    })
  })
  return result
}

function handleAdded (result: ITempRequestResult, cfgs: IRequestConfig[]) {
  if (!cfgs.length) return result
  const newCfgs = analyzeConfigs(cfgs)
  return result
}

function analyzeConfigs (configs: IRequestConfig[]) {
  return configs.map((cfg) => {
    const item: IRtRequestConfig = {
      id: cfg.id,
      matchUrl: cfg.id,
      url: cfg.url,
      useReg: cfg.useReg,
      reg: cfg.useReg ? RegExp(cfg.matchUrl) : convertPattern2Reg(cfg.matchUrl),
      rules: {}
    }
    const excluedKeys = ['INJECT', 'CORS_OUT', 'UA_OUT', 'UA', 'REFERRER_OUT', 'REFERRER']
    const rules = item.rules
    Object.keys(cfg.rules).reduce((acc, k) => {
      if (!excluedKeys.includes(k)) {
        // @ts-ignore
        acc[k] = cfg.rules[k]
      }
      return acc
    }, rules)

    if (cfg.rules[EWebRuleType.REFERRER]) {
      const headerRule = cfg.rules[EWebRuleType.HEADER] || (cfg.rules[EWebRuleType.HEADER] = { cmd: EWebRuleType.HEADER, rules: [] })
      headerRule.rules.push({
        type: 'delete',
        name: 'Referer'
      })
    }

    if (cfg.rules[EWebRuleType.UA]) {
      const headerRule = cfg.rules[EWebRuleType.HEADER] || (cfg.rules[EWebRuleType.HEADER] = { cmd: EWebRuleType.HEADER, rules: [] })
      headerRule.rules.push({
        type: 'update',
        name: 'User-Agent',
        val: cfg.rules[EWebRuleType.UA]!.ua
      })
    }
    return item
  })
}

function createRequestListener (type: string) {
  const processor = REQUEST_RULE_CACHE_DATA[type]
  return function (details: chrome.webRequest.WebRequestDetails) {
    const url = details.url
    const config = processor.rules.find(item => item.reg.test(url))
    if (!config || !Object.keys(config.rules).length || !processor) {
      console.warn(`cannot match url ${url} or processor for ${type} not found`)
      return
    }
    const result = runProcessor(processor.fns, config, details)
    return Object.keys(result).length ? result : undefined
  }
}


function runProcessor (fns: IRequestCacheItem['fns'], config: IRtRequestConfig, details: chrome.webRequest.WebRequestDetails) {
  const result: IRequestListenerResult = {}
  Object.keys(config.rules).forEach(k => {
    // @ts-ignore
    const rule = config.rules[k] as IWebRule
    const cmd = rule.cmd
    const fn = fns.find(fn => fn.type === cmd)
    if (!fn) return
    fn.fn(result, details, rule, config)
  })
  return result
}