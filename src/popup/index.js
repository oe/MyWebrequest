import Vue from 'vue'
import VueI18n from 'vue-i18n'
import App from '@/popup/main'
import lang from '@/common/lang'
console.log('lang', lang)
// debugger
Vue.use(VueI18n)
Vue.config.lang = lang

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
