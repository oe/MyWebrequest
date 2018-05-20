import Vue from 'vue'
import Vuex from 'vuex'
import collection from '@/common/collection'
import cutils from '@/common/utils'
import utils from '@/options/components/utils'

Vue.use(Vuex)

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
  },
  ruleCount (state) {
    return state.rules.length
  },
  hasNoEnabledRule (state) {
    return !state.rules.some(rule => rule.enabled)
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
  toggleRule (state, id) {
    const rules = state.rules
    if (!Array.isArray(rules)) return
    const rule = rules.find(el => el.id === id)
    if (!rule) return
    rule.enabled = !rule.enabled
  },
  addRule (state, rule) {
    const now = Date.now()
    if (typeof rule === 'string') {
      rule = { url: rule }
    }
    rule = Object.assign(
      {
        id: utils.guid(),
        createdAt: now,
        updatedAt: now,
        enabled: true
      },
      rule
    )
    const existRule = state.rules.find(r => r.id === rule.id)
    if (existRule) {
      Object.assign(existRule, rule)
    } else {
      state.rules.push(rule)
    }
  },
  removeRules (state, ids) {
    const rules = state.rules && state.rules.length && state.rules
    if (!ids) return
    if (!Array.isArray(ids)) ids = [ids]
    state.rules = rules.filter(r => {
      return !cutils.inArray(ids, r.id)
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

export default new Vuex.Store({
  state,
  getters,
  mutations,
  actions,
  strict: process.env.NODE_ENV !== 'production'
})
