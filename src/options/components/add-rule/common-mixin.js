// import VueI18n from 'vue-i18n'
import utils from '@/options/components/helper/utils'
import validate from '@/options/components/helper/validate'
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
        const target = e.target
        const selected = target.value.substring(
          target.selectionStart,
          target.selectionEnd
        )
        // input has value & selected is equal to the value
        if (target.value && target.value !== selected) {
          return
        }
        // remove hash
        url = url.replace(/#.*$/, '')
        validate.checkURL(url)
        e.preventDefault()

        let matchURL = url
        // remove protocol for hsts
        if (this.module === 'hsts') {
          matchURL = url.replace(/^\w+:\/\//, '')
        }
        this.form.matchURL = matchURL
        // if has selected text, deselect it
        if (selected) {
          target.focus()
        }
        // if test url is empty and url is valid url, use url as the test url
        if (!this.form.testURL) this.form.testURL = url
      } catch (e) {
        // statements
        console.warn('url invalid', e)
      }
    },
    checkTestURL (url) {
      if (typeof this.needTest === 'undefined' || this.needTest) {
        const val = url.trim()
        if (!val) {
          throw utils.createError('test-url-empty')
        }
        validate.checkURL(val)
      }
    },
    validateTestURL (rule, value, cb) {
      try {
        this.checkTestURL(value)
        cb()
      } catch (error) {
        cb(error)
      }
    },
    onAddRule () {},
    resetForm () {},
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
    },
    isRuleExist (rule) {
      const url = typeof rule === 'object' ? rule.url : rule
      return this.rules.find(itm => itm.url === url)
    },
    isRuleIntersect (url, ignoreID) {
      this.rules.some(rule => {
        if (ignoreID && rule.id === ignoreID) return false
        if (validate.isSubRule(rule.url, url)) {
          throw utils.createError('rule-be-included', rule)
        } else if (validate.isSubRule(url, rule.url)) {
          throw utils.createError('rule-include-others', rule)
        }
      })
    },
    getRuleByID (id) {
      return this.rules.find(rule => rule.id === id)
    }
  },
  computed: {
    ...mapState({
      module: state => state.rule.module,
      rules: state => state.rule.rules
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
    },
    ruleID (newVal, oldVal) {
      // update rule form when ruleID changed
      if (oldVal) this.resetRuleForm()
    }
  }
}
