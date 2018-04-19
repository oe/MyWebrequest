import Vue from 'vue'
import Vuex from 'vuex'

import rules from './rules'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    rules
  },
  strict: process.env.NODE_ENV !== 'production'
})
