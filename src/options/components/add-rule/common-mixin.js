// import VueI18n from 'vue-i18n'
import utils from '@/options/components/utils'
import cutils from '@/common/utils'
import { mapActions, mapState } from 'vuex'
import locales from './locales.json'

// merger langs with locales
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
      let url = e.clipboardData.getData('text/plain')
      try {
        // remove hash
        url = url.replace(/#.*$/, '')
        utils.testURLRuleValid(url)
        const parts = utils.getURLParts(url)
        if (!parts) return
        this.form.protocol = parts[1]
        const host = parts[2]
        const pathname = (parts[3] || '') + (parts[4] || '')
        if (this.$options.name === 'custom') {
          this.form.url = host + '/' + pathname
        } else {
          this.form.host = host
          this.form.pathname = pathname
        }
        e.preventDefault()
      } catch (e) {
        // statements
        console.log(e)
      }
    },
    onAddRule () {},
    resetForm () {
      this.$refs.ruleForm.resetFields()
    },
    isRuleExist (rule) {
      const url = typeof rule === 'object' ? rule.url : rule
      return cutils.findInArr(this.rules, itm => itm.url === url)
    }
  },
  computed: {
    ...mapState({
      rules: state => state.rules
    })
  }
}
