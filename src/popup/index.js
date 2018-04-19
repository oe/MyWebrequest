import Vue from 'vue'
import VueI18n from 'vue-i18n'
import i18n from '@/common/i18n'
import locales from '@/common/locales'
import App from './main'

Vue.use(VueI18n)
Vue.config.lang = i18n.lang

for (var key in locales) {
  if (locales.hasOwnProperty(key)) {
    Vue.locale(key, locales[key])
  }
}

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render (h) {
    return h('app')
  },
  components: { App }
})
