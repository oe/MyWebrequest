import collection from '@/common/collection'

const state = {
  module: '',
  rules: null
}

const mutations = {
  changeModule (state, module) {
    state.module = module
  },
  updateRules (state, module) {
    state.rules = collection.get(module)
  },
  addRule (state, rule) {
    state.rules.push({
      url: rule,
      enabled: true
    })
    collection.save(state.module, state.rules)
  }
}

const getters = {}

const actions = {
  changeModule (ctx, payload) {
    ctx.commit('changeModule', payload.module)
    ctx.commit('updateRules', payload.module)
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
