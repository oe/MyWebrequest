import REDIRECT from './redirect'
import CORS from './cors'
import HSTS from './hsts'
import BLOCK from './block'
import HEADER from './header'
import LOG from './log'
import onTabChange from './tab-change'
import { uniqueArray, convertPattern2Reg } from '@/common/utils'
import { isRuleEnabled, diffArray, spliceArray } from '@/background/requests/utils'
import { IWebRequestRule, IRtHeaderRuleItem, IUaRule, IReferrerRule, IRequestConfig, IAlterHeaderRule, EWebRuleType, IRtRequestConfig } from '@/types/requests'

const REQUESTS = {
  BLOCK,
  CORS,
  HEADER,
  HSTS,
  LOG,
  REDIRECT
}

const cacheRules: IRtRequestConfig[] = []

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

interface IRequestFn {
  permit: string[]
  fns: ({ type: string, fn: Function })[]
}

interface IRequestFns {
  [k: string]: IRequestFn
}

function init () {
  const evtProcessors: IRequestFns = {}
  const requestTypes = Object.keys(REQUESTS)
  WEB_REQUEST_EVENT_FLOW.forEach((evtName) => {
    requestTypes.forEach((type) => {
      // @ts-ignore
      let processors = REQUESTS[type] as IWebRequestRule<any, any>[]
      processors = processors.filter(item => item.on === evtName)
      if (!processors.length) return
      if (processors.length > 1) throw new Error(`${type} should have only one processor on event ${evtName}`)
      const processor = processors[0]
      const evtProcessor = evtProcessors[evtName] || (evtProcessors[evtName] = { permit: [], fns: [] })
      evtProcessor.permit.push(...processor.permit)
      evtProcessor.fns.push({
        fn: processor.fn,
        type
      })
    })
  })
  Object.keys(evtProcessors).forEach((key) => {
    const processor = evtProcessors[key]
    processor.permit = uniqueArray(processor.permit)
  })
  return evtProcessors
}

const EVT_PROCESSORS = init()

export function onRequestsChange (newVal: IRequestConfig[], oldVal?: IRequestConfig[]) {
  console.warn('newVal', newVal)
  const diffResult = diffArray(newVal.filter(isRuleEnabled), (oldVal || []).filter(isRuleEnabled), isEqual, isSame)
  onTabChange(diffResult)
}

function isEqual (a: IRequestConfig, b: IRequestConfig) {
  // same id & chrome match url pattern not change
  return a.id === b.id && a.updatedAt === b.updatedAt
}

function isSame (a: IRequestConfig, b: IRequestConfig) {
  return a.id === b.id
}

function analyzeConfigs (configs: IRequestConfig[]) {
  return configs.map((cfg) => {
    const item: IRtRequestConfig = {
      id: cfg.id,
      matchUrl: cfg.id,
      url: cfg.url,
      useReg: cfg.useReg,
      reg: cfg.useReg ? RegExp(cfg.matchUrl) : convertPattern2Reg(cfg.matchUrl),
      rules: []
    }
    const inHeaders = spliceArray(cfg.rules, (item) => {
      return (item.cmd === EWebRuleType.REFERRER || item.cmd === EWebRuleType.UA) && item.type === 'in'
    }) as (IUaRule | IReferrerRule)[]

    spliceArray(cfg.rules, (item) => {
      return item.cmd === EWebRuleType.INJECT || (item.cmd === EWebRuleType.REFERRER || item.cmd === EWebRuleType.UA) && item.type === 'out'
    })
    // @ts-ignore
    item.rules = cfg.rules

    const alterHeaders = (spliceArray(cfg.rules, (item) => item.cmd === EWebRuleType.HEADER) as IAlterHeaderRule[]).map(item => ({
      type: item.type,
      name: item.name,
      val: item.type === 'update' ? item.val : undefined
    })) as IRtHeaderRuleItem[]

    // @ts-ignore
    alterHeaders.push(...inHeaders.map(item => {
      const isRefer = item.cmd === EWebRuleType.REFERRER
      return {
        type: isRefer ? 'delete' : 'update',
        name: isRefer ? 'Referer' : 'User-Agent',
        // @ts-ignore
        val: isRefer ? undefined : item.ua
      }
    }))
    if (alterHeaders.length) {
      item.rules.push({
        cmd: EWebRuleType.HEADER,
        rules: alterHeaders
      })
    }
    return item
  })
}

function createRequestListener (type: string) {
  return function (details: chrome.webRequest.WebRequestDetails) {
    const url = details.url
    const config = cacheRules.find(item => item.reg.test(url))
    const processor = EVT_PROCESSORS[type]
    if (!config || !config.rules.length || !processor) {
      console.warn(`cannot match url ${url} or processor for ${type} not found`)
      return
    }
    return runProcessor(processor.fns, config, details)
  }
}



function runProcessor (fns: IRequestFn['fns'], config: IRtRequestConfig, details: chrome.webRequest.WebRequestDetails) {
  const result: Partial<chrome.webRequest.WebRequestDetails> = {}
  config.rules.forEach(rule => {
    const cmd = rule.cmd
    const fn = fns.find(fn => fn.type === cmd)
    if (!fn) return
    fn.fn(result, details, rule, config)
  })
  return result
}