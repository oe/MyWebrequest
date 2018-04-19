import Vue from 'vue'
import VueI18n from 'vue-i18n'
import ElementUI from 'element-ui'
import enLocale from 'element-ui/lib/locale/lang/en'
import zhLocale from 'element-ui/lib/locale/lang/zh-CN'
import i18n from '@/common/i18n'
import locales from '@/common/locales'
import 'element-ui/lib/theme-chalk/index.css'
import store from './store'
import App from './main'
import router from './router'

Vue.use(VueI18n)
Vue.use(ElementUI)

// Vue.config.lang = i18n.lang
Vue.config.lang = 'en'

// translate text out of vue app
document.documentElement.innerHTML = i18n.internationalize(
  document.documentElement.innerHTML
)

Vue.locale('zh-cn', zhLocale)
Vue.locale('en', enLocale)

// register custom locale
for (var key in locales) {
  if (locales.hasOwnProperty(key)) {
    Vue.locale(key, locales[key])
  }
}

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  render (h) {
    return h('app')
  },
  components: { App }
})
