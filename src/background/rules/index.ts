import redirect from './redirect'
import cors from './cors'
import hsts from './hsts'
import block from './block'
import header from './header'
import log from './log'
import { isRuleEnabled, diffArray, sliceArray } from '@/background/utils'
import { IUaRule, IReferrerRule, IRuleConfig, IAlterHeaderRule, EWebRuleType } from '@/types/web-rule'
// import ua from './ua'
// import contextmenu from './contextmenu'

const cacheRules: IRuleConfig[] = []

function findCfgIdx (oldCfgs: IRuleConfig[], cfg: IRuleConfig) {
  return oldCfgs.findIndex((item) => item.id === cfg.id && item.updatedAt === cfg.updatedAt)
}

function handleRuleConfigChange (configs: IRuleConfig[]) {
  const newConfigs = configs.filter(isRuleEnabled)
  const diff = diffArray(newConfigs, cacheRules, findCfgIdx)

}

function analyzeConfigs (configs: IRuleConfig[]) {
  configs.map((cfg) => {
    const headers = sliceArray(cfg.rules, (item) => {
      return item.cmd === EWebRuleType.REFERRER || item.cmd === EWebRuleType.UA
    }) as (IUaRule | IReferrerRule)[]
    const inHeaders = sliceArray(headers, (item) => item.type === 'in')

    const alterHeaders = (sliceArray(cfg.rules, (item) => item.cmd === EWebRuleType.HEADER) as IAlterHeaderRule[]).map(item => ({
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

export default {
  redirect,
  cors,
  hsts,
  block,
  header,
  log,
  // contextmenu
}
