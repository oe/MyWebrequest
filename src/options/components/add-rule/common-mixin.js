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
      originalForm: {},
      // set to true before update a rule in dialog
      //   and will skip duplicated rule check
      isUpdate: true
    }
  },
  props: {
    ruleID: {
      type: String,
      default: ''
    }
  },
  created () {
    this.resetRuleForm()
  },
  methods: {
    ...mapActions(['addRule', 'isRuleNeedTest']),
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
        this.form.url = host + (pathname || '')
        // if test url is empty and url is valid url, use url as test url
        if (!this.form.testUrl && utils.isURL(url)) this.form.testUrl = url
        e.preventDefault()
      } catch (e) {
        // statements
        console.log(e)
      }
    },
    onAddRule () {},
    async resetRuleForm () {
      this.resetForm()
      this.$refs.ruleForm && this.$refs.ruleForm.clearValidate()
      this.originalForm = Object.assign({}, this.form)
      if (this.module !== 'custom') {
        this.needTest = await this.isRuleNeedTest({ module: this.module })
      }
    },
    clearForm () {
      this.$refs.ruleForm && this.$refs.ruleForm.resetFields()
      this.form.protocol = this.module === 'hsts' ? 'http' : '*'
    },
    isRuleExist (rule) {
      const url = typeof rule === 'object' ? rule.url : rule
      return this.rules.find(itm => itm.url === url)
    },
    isRuleIntersect (url, ignoreID) {
      this.rules.some(rule => {
        if (ignoreID && rule.id === ignoreID) return false
        let err
        if (utils.isSubRule(rule.url, url)) {
          err = new Error('ruleBeIncluded')
        } else if (utils.isSubRule(url, rule.url)) {
          err = new Error('ruleIncludOthers')
        }
        if (err) {
          err.rule = rule
          throw err
        }
      })
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
      this.resetRuleForm()
    },
    form: {
      handler (newVal) {
        const original = this.originalForm
        // all changed values
        const diffs = Object.keys(newVal).filter(k => {
          return newVal[k] !== original[k]
        })
        if (diffs.includes('protocol')) diffs.push('url')

        const validateRules = this.validateRules
        Object.keys(validateRules).forEach(k => {
          if (k === 'trigger') return
          const trigger = diffs.includes(k) ? 'blur' : 'none'
          validateRules[k].trigger = trigger
          // console.log('trigger for', k, trigger)
          if (trigger === 'none') {
            const field = this.$refs.ruleForm.fields.find(vm => {
              return vm.prop === k
            })
            if (field) field.clearValidate()
          }
        })
      },
      deep: true
    }
  }
}
