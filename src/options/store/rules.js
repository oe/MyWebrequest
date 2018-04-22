import collection from '@/common/collection'
import cutils from '@/common/utils'

const state = {
  module: '',
  sortedBy: '',
  rules: null
}

const getters = {
  sortedRules (state) {
    if (!Array.isArray(state.rules)) return state.rules
    const rules = Object.assign([], state.rules)
    return rules.sort((a, b) => {
      if (a.updatedAt && b.updatedAt) return b.updatedAt - a.updatedAt
      return a.updatedAt ? -1 : b.updatedAt ? 1 : 0
    })
  }
}

const mutations = {
  changeModule (state, module) {
    state.module = module
  },
  updateRules (state, module) {
    state.rules = collection.get(module)
  },
  saveRules (state) {
    collection.save(state.module, state.rules)
  },
  toggleRule (state, url) {
    const rules = state.rules
    if (!Array.isArray(rules)) return
    const rule = cutils.findInArr(rules, el => el.url === url)
    if (!rule) return
    rule.enabled = !rule.enabled
  },
  addRule (state, rule) {
    const now = Date.now()
    if (typeof rule === 'string') {
      rule = {
        url: rule,
        createdAt: now
      }
    }
    rule = Object.assign(
      {
        updatedAt: now,
        enabled: true
      },
      rule
    )
    state.rules.push(rule)
  },
  removeRules (state, urls) {
    const rules = state.rules && state.rules.length && state.rules
    if (!rules) return
    if (!Array.isArray(urls)) urls = [urls]
    state.rules = rules.filter(r => {
      return !cutils.inArray(urls, r.url)
    })
  }
}

const actions = {
  changeModule (ctx, payload) {
    ctx.commit('changeModule', payload.module)
    ctx.commit('updateRules', payload.module)
  },
  addRule (ctx, payload) {
    ctx.commit('addRule', payload)
    ctx.commit('saveRules')
  },
  toggleRule (ctx, payload) {
    ctx.commit('toggleRule', payload)
    ctx.commit('saveRules')
  },
  removeRules (ctx, urls) {
    if (!Array.isArray(urls)) urls = [urls]
    ctx.commit('removeRules', urls)
    ctx.commit('saveRules')
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
