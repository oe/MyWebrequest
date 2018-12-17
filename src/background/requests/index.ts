import REDIRECT from './redirect'
import CORS from './cors'
import HSTS from './hsts'
import BLOCK from './block'
import HEADER from './header'
import LOG from './log'
import onTabChange from './tab-change'
import { isRuleEnabled, diffArray, spliceArray } from '@/background/utils'
import { IUaRule, IReferrerRule, IRuleConfig, IAlterHeaderRule, EWebRuleType } from '@/types/web-rule'
import { IWebRequestRule } from '@/types/runtime-webrule'

const REQUESTS = {
  BLOCK,
  CORS,
  HEADER,
  HSTS,
  LOG,
  REDIRECT
}

const cacheRules: IRuleConfig[] = []

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

interface IRequestFns {
  [k: string]: {
    permit: string[]
    fns: ({ type: string, fn: Function })[]
  }
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
  return evtProcessors
}

export function onRequestsChange (newVal: IRuleConfig[], oldVal?: IRuleConfig[]) {
  const diffResult = diffArray(newVal.filter(isRuleEnabled), (oldVal || []).filter(isRuleEnabled), isEqual, isSame)
  onTabChange(diffResult)
}

function isEqual (a: IRuleConfig, b: IRuleConfig) {
  return a.id === b.id && a.updatedAt === b.updatedAt
}

function isSame (a: IRuleConfig, b: IRuleConfig) {
  return a.id === b.id
}

function analyzeConfigs (configs: IRuleConfig[]) {
  configs.map((cfg) => {
    const headers = spliceArray(cfg.rules, (item) => {
      return item.cmd === EWebRuleType.REFERRER || item.cmd === EWebRuleType.UA
    }) as (IUaRule | IReferrerRule)[]
    const inHeaders = spliceArray(headers, (item) => item.type === 'in')

    const alterHeaders = (spliceArray(cfg.rules, (item) => item.cmd === EWebRuleType.HEADER) as IAlterHeaderRule[]).map(item => ({
      type: item.type,
      name: item.name,
      val: item.type === 'update' ? item.val : undefined
    }))

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
  })
}
