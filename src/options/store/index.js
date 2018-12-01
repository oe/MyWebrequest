import Vue from 'vue'
import Vuex from 'vuex'

import ruleStore from './rule'
import additionStore from './addition'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    rule: ruleStore,
    addition: additionStore
  },
  strict: process.env.NODE_ENV !== 'production'
})
