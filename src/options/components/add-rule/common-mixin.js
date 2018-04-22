// import VueI18n from 'vue-i18n'
import utils from '@/options/components/utils'
import cutils from '@/common/utils'
import { mapActions, mapState } from 'vuex'
import locales from './locales.json'

export function mergeLang (lang = {}) {
  const result = {}
  let keys = Object.keys(lang).concat(Object.keys(locales))
  keys = keys.filter((k, i) => keys.indexOf(k) === i)

  keys.forEach(k => {
    result[k] = Object.assign(lang[k] || {}, locales[k] || {})
  })
  return result
}

export default {
  methods: {
    ...mapActions(['addRule']),
    onPaste (e) {
      const uri = utils.parseURL(e.clipboardData.getData('text/plain'))
      if (!utils.isProtocol(uri.protocol)) return
      this.protocol = uri.protocol
      this.url = uri.raw.replace(`${uri.protocol}://`, '')
      e.preventDefault()
    },
    isRuleExist (rule) {
      const url = typeof rule === 'object' ? rule.url : rule
      return cutils.findInArr(this.rules, itm => itm.url === url)
    }
  },
  computed: {
    ...mapState({
      rules: state => state.rules.rules
    })
  }
}
