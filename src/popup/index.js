import Vue from 'vue'
import VueI18n from 'vue-i18n'
import App from '@/popup/main'
import lang from '@/common/lang'
import locales from '@/common/locales'
console.log('lang', lang)
// debugger
Vue.use(VueI18n)
Vue.config.lang = lang

for (var key in locales) {
  if (locales.hasOwnProperty(key)) {
    Vue.locale(key, locales[key])
  }
}

window.vv = Vue
/* eslint-disable no-new */
new Vue({
  el: '#app',
  // template: '<App/>',
  render(h) {
    return h('app')
  },
  components: { App }
})
