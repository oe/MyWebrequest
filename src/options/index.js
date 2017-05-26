import Vue from 'vue'
import VueI18n from 'vue-i18n'
import enLocale from 'element-ui/lib/locale/lang/en'
import zhLocale from 'element-ui/lib/locale/lang/zh-CN'
import ElementUI from 'element-ui'
import i18n from '@/common/i18n'
import locales from '@/common/locales'
import 'element-ui/lib/theme-default/index.css'

import App from './main'



Vue.use(VueI18n)
Vue.use(ElementUI)
Vue.config.lang = i18n.lang

// translate text out of vue app
document.documentElement.innerHTML = i18n.internationalize( document.documentElement.innerHTML );

Vue.locale('zh-cn', zhLocale)
Vue.locale('en', enLocale)

for (var key in locales) {
  if (locales.hasOwnProperty(key)) {
    Vue.locale(key, locales[key])
  }
}


/* eslint-disable no-new */
new Vue({
  el: '#app',
  render(h) {
    return h('app')
  },
  components: { App }
})
