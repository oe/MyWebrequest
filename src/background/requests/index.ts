import clonedeep from 'lodash.clonedeep'
import REDIRECT from './redirect'
import CORS from './cors'
import HSTS from './hsts'
import BLOCK from './block'
import HEADER from './header'
import LOG from './log'
import onTabChange from './tab-change'
import { uniqueArray, convertPattern2Reg, getRuleUrlReg } from '@/common/utils'
import { isRuleEnabled, diffArray, pickObject, IDiffArrayResult, toggleWebRequest } from '@/background/requests/utils'
import { IRequestCacheItem, IRequestCache, IRequestListenerResult, IWebRequestRule, IWebRule, IRequestConfig, EWebRuleType, IRtRequestConfig } from '@/types/requests'

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


interface ITempRequestResult {
  [k: string]: IRtRequestConfig[]
}

interface ITempRequestItem {
  [k: string]: IRtRequestConfig
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
      const evtProcessor = REQUEST_RULE_CACHE_DATA[evtName] || (REQUEST_RULE_CACHE_DATA[evtName] = { permit: [], fns: [], rules: [], ruleTypes: [], isOn: false, evtName })
      evtProcessor.permit.push(...processor.permit)
      evtProcessor.fns.push({
        fn: processor.fn,
        type: type as EWebRuleType
      })
      evtProcessor.ruleTypes.push(type as EWebRuleType)
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
  Object.keys(REQUEST_RULE_CACHE_DATA).forEach(k => {
    const isNotChange = isRuleSame(tempResult[k], REQUEST_RULE_CACHE_DATA[k].rules)
    const newRules = tempResult[k] || []
    REQUEST_RULE_CACHE_DATA[k].rules = newRules
    if (!isNotChange) toggleWebRequest(REQUEST_RULE_CACHE_DATA[k])
  })
}

function isRuleSame (newRules?: IRtRequestConfig[], oldRules?: IRtRequestConfig[]) {
  if (!newRules && !oldRules) return true
  if (!newRules || !oldRules) return false
  if (newRules.length !== oldRules.length) return false
  return newRules.some((item) => !oldRules.find(oitem => item.id === oitem.id && item.url === oitem.url))
}

function handleRemoved (result: ITempRequestResult, cfgs: IRequestConfig[]) {
  if (!cfgs.length) return result
  cfgs.forEach(cfg => {
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

  return cfgs.reduce((acc, cur) => {
    const cfg = normalizeConfig(cur)
    const curId = cur.id
    Object.keys(cfg).forEach(k => {
      const resultList = result[k]
      const idx = resultList.findIndex(item => item.id === curId)
      resultList[idx] = cfg[k]
    })
    return acc
  }, result)
}

function handleAdded (result: ITempRequestResult, cfgs: IRequestConfig[]) {
  if (!cfgs.length) return result
  return cfgs.reduce((acc, cur) => {
    const cfg = normalizeConfig(cur)
    Object.keys(cfg).forEach(k => {
      result[k].push(cfg[k])
    })
    return acc
  }, result)
}

function normalizeConfig (cfg: IRequestConfig) {
  const item: IRtRequestConfig = {
    id: cfg.id,
    matchUrl: cfg.id,
    url: cfg.url,
    useReg: cfg.useReg,
    reg: cfg.useReg ? RegExp(cfg.matchUrl) : convertPattern2Reg(cfg.matchUrl),
    rules: {}
  }
  const pickKeys = ['REDIRECT', 'HSTS', 'BLOCK', 'HEADER', 'CORS', 'LOG']
  item.rules = pickObject(item.rules, pickKeys)!


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
  return Object.keys(REQUEST_RULE_CACHE_DATA).reduce((acc, cur) => {
    const ruleTypes = REQUEST_RULE_CACHE_DATA[cur].ruleTypes
    const rules = pickObject(cfg.rules, ruleTypes)
    if (rules) {
      const config = clonedeep(cfg)
      config.rules = rules
      acc[cur] = Object.assign(config, { reg: getRuleUrlReg(config) })
    }
    return acc
  }, {} as ITempRequestItem)
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