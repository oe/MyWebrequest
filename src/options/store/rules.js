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
  toggleRule (state, idx) {
    console.warn('toogle ru', idx)
    const rule = state.rules && state.rules[idx]
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
  removeRules (state, idxs) {
    const rules = state.rules && state.rules.length && state.rules
    if (!rules) return
    if (!Array.isArray(idxs)) idxs = [idxs]
    console.warn('idxs', idxs)
    state.rules = rules.filter((r, idx) => {
      return !cutils.inArray(idxs, idx)
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
  removeRules (ctx, payload) {
    ctx.commit('removeRules', payload)
    ctx.commit('saveRules')
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
