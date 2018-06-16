import Vue from 'vue'
import Vuex from 'vuex'
import collection from '@/common/collection'
import cutils from '@/common/utils'

const RULE_CAT_NEED_TEST = 'ruleCatNeedTest'

Vue.use(Vuex)

const state = {
  module: '',
  sortedBy: '',
  rules: []
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
  updateRules (state, rules) {
    state.rules = rules
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
        id: cutils.guid(),
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
      return ids.indexOf(r.id) === -1
    })
  }
}

const actions = {
  async changeModule (ctx, payload) {
    const mdl = payload.module
    // ctx.commit('updateRules', defaultVal)
    ctx.commit('changeModule', mdl)
    if (!cutils.RULE_TYPES.includes(mdl)) return
    const rules = await collection.get(mdl)
    ctx.commit('updateRules', rules || [])
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
  },
  // enable/disable
  async toggleRuleTest (ctx, payload) {
    let list = await collection.getConfig(RULE_CAT_NEED_TEST)
    list = list || []
    if (list.includes(payload.module)) {
      if (!payload.isOn) {
        const idx = list.indexOf(payload.module)
        list.splice(idx, 1)
        await collection.setConfig(RULE_CAT_NEED_TEST, list)
      }
      return
    }
    if (payload.isOn) {
      list.push(payload.module)
      await collection.setConfig(RULE_CAT_NEED_TEST, list)
    }
  },
  // is rule need test
  async isRuleNeedTest (ctx, payload) {
    let list = await collection.getConfig(RULE_CAT_NEED_TEST)
    list = list || []
    return list.includes(payload.module)
  }
}

export default new Vuex.Store({
  state,
  getters,
  mutations,
  actions,
  strict: process.env.NODE_ENV !== 'production'
})
