// import VueI18n from 'vue-i18n'
import utils from '@/options/components/utils'
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
  data () {
    return {
      originalForm: {}
    }
  },
  props: {
    ruleID: {
      type: String,
      default: ''
    }
  },
  created () {
    this.resetForm()
    this.originalForm = Object.assign({}, this.form)
  },
  methods: {
    ...mapActions(['addRule']),
    onPaste (e) {
      let url = e.clipboardData.getData('text/plain')
      try {
        const isCustom = this.$options.name === 'custom'
        // remove hash
        url = url.replace(/#.*$/, '')
        utils.testURLRuleValid(url, isCustom)
        const parts = utils.getURLParts(url)
        if (!parts) return
        this.form.protocol = parts[1]
        const host = parts[2]
        const pathname = (parts[3] || '') + (parts[4] || '')
        if (isCustom) {
          this.form.url = host + (pathname || '')
          // if test url is empty and url is valid url, use url as test url
          if (!this.form.testUrl && utils.isURL(url)) this.form.testUrl = url
        } else {
          this.form.host = host
          this.form.pathname = pathname.replace(/^\//, '')
        }
        e.preventDefault()
      } catch (e) {
        // statements
        console.log(e)
      }
    },
    onAddRule () {},
    clearForm () {
      if (this.$refs.ruleForm) this.$refs.ruleForm.resetFields()
      this.form.protocol = this.module === 'hsts' ? 'http' : '*'
    },
    isRuleExist (rule) {
      const url = typeof rule === 'object' ? rule.url : rule
      return this.rules.find(itm => itm.url === url)
    },
    getRuleByID (id) {
      return this.rules.find(rule => rule.id === id)
    }
  },
  computed: {
    ...mapState({
      module: state => state.module,
      rules: state => state.rules
    })
  },
  watch: {
    $route () {
      this.resetForm()
    }
  }
}
