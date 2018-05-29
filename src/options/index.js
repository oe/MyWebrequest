import Vue from 'vue'
import VueI18n from 'vue-i18n'
import {
  Autocomplete,
  Select,
  Option,
  Checkbox,
  Dialog,
  Button,
  RadioGroup,
  Radio,
  Tabs,
  Col,
  Row,
  Form,
  FormItem,
  Input,
  TabPane,
  Popover,
  Table,
  TableColumn,
  Switch
} from 'element-ui'
import enLocale from 'element-ui/lib/locale/lang/en'
import elLocale from 'element-ui/lib/locale'
import i18n from '@/common/i18n'
import locales from '@/common/locales'
import store from './store'
import App from './main'
import router from './router'
import titlebar from './components/titlebar'
import fixes from './fixes'

elLocale.use(enLocale)
Vue.use(VueI18n)

Vue.config.lang = i18n.lang
// Vue.config.lang = 'en'

// translate text out of vue app
document.documentElement.innerHTML = i18n.internationalize(
  document.documentElement.innerHTML
)

const components = [
  Autocomplete,
  Select,
  Option,
  Checkbox,
  Dialog,
  Button,
  RadioGroup,
  Radio,
  Tabs,
  Col,
  Row,
  Form,
  FormItem,
  Input,
  TabPane,
  Popover,
  Table,
  TableColumn,
  Switch
]
fixes.fixAutocomplete(Autocomplete)
components.forEach(c => Vue.use(c))

// register custom locale
for (var key in locales) {
  if (locales.hasOwnProperty(key)) {
    Vue.locale(key, locales[key])
  }
}

Vue.component('titlebar', titlebar)

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
