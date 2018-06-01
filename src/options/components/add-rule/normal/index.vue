<template>
<el-form label-position="top" :model="form" :rules="validateRules" ref="ruleForm">
  <el-form-item :label="$t('matchLbl')" :error="errorMsg" prop="url">
    <el-input
      size="small"
      v-model="form.url"
      @input="onFormChange"
      @paste.native="onPaste"
      @keyup.native.enter="onAddRule"
      ref="firstInput"
      autocorrect="off"
      spellcheck="false"
      v-popover:urlPopover
      placeholder="url, required, paste a url here" >
      <el-select v-model="form.protocol" slot="prepend" :disabled="disableProtocol">
        <el-option label="*://" value="*"></el-option>
        <el-option label="http://" value="http"></el-option>
        <el-option label="https://" value="https"></el-option>
      </el-select>
      <el-button v-if="!ruleID" slot="append" @click="onAddRule">{{$t('addRuleBtn')}}</el-button>

    </el-input>
  </el-form-item>
<!--   <el-popover
    ref="urlPopover"
    placement="bottom"
    title="标题"
    trigger="focus"
    content="这是一段内容,这是一段内容,这是一段内容,这是一段内容。">
  </el-popover> -->
</el-form>
</template>

<script>
import utils from '@/options/components/utils'
import mixin, { mergeLang } from '../common-mixin'
// import locales from './locales.json'
const lang = mergeLang({})

export default {
  locales: lang,
  mixins: [mixin],
  data () {
    return {
      disableProtocol: false,
      form: {
        protocol: '*',
        url: ''
      },
      validateRules: {
        // by default, validator wont trigger on input blur
        url: {validator: this.validateURL, trigger: 'none'}
      },
      // 错误信息
      errorMsg: '',
      etid: 0,
      // set to true before update a rule in dialog
      isUpdate: false,
      isHiding: false
    }
  },
  mounted () {
    window.ff = this.$refs.ruleForm
  },
  methods: {
    validateURL (rule, value, cb) {
      try {
        this.validateRule(this.form, this.isUpdate && this.ruleID)
        cb()
      } catch (e) {
        console.log(e)
        // return cb(new Error(this.$t('qrMakeMacBtn')))
        return cb(e)
      }
    },
    async onAddRule () {
      this.isUpdate = false
      const isValid = await this.$refs.ruleForm.validate()
      console.warn('isValid', isValid)
      if (isValid) this.addARule()
    },
    async onUpdateRule () {
      this.isUpdate = true
      const isValid = await this.$refs.ruleForm.validate()
      if (isValid) this.addARule(this.ruleID)
    },
    addARule (ruleID) {
      try {
        let url = this.validateRule(this.form, ruleID)
        if (ruleID) {
          const rule = this.getRuleByID(this.ruleID)
          url = Object.assign({}, rule, {url, updatedAt: Date.now()})
        }
        this.addRule(url)
        this.clearForm()
        return true
      } catch (e) {
        this.showInputError('Same rule has already added')
        console.error('failed', e)
        return false
      }
    },
    onFormChange () {
      this.hideInputError()
    },
    showInputError (msg) {
      clearTimeout(this.etid)
      this.isHiding = false
      this.errorMsg = msg
    },
    hideInputError () {
      if (this.isHiding || !this.errorMsg) return
      console.log('on change')
      this.isHiding = true
      this.etid = setTimeout(() => {
        this.errorMsg = ''
        this.isHiding = false
      }, 1000)
    },
    resetForm () {
      this.clearForm()
      const isHsts = this.module === 'hsts'
      this.disableProtocol = isHsts
      if (this.ruleID) {
        const rule = this.getRuleByID(this.ruleID)
        if (rule) {
          const parts = utils.getURLParts(rule.url)
          if (parts) {
            this.form.protocol = parts[1]
            this.form.url = parts[2] + parts[3] + (parts[4] || '')
          }
        }
      }
      if (isHsts) this.form.protocol = 'http'
    },
    /**
     * validate form data
     *   if not pass this validate, an error will be throwed
     * @param  {Object} data     rule components
     * @param  {String|Null} ignoreID if passed, ignore this id when check duplicated rules (for updating an existing rule)
     * @return {String}          validated rule
     */
    validateRule (data, ignoreID) {
      const protocol = data.protocol
      let url = data.url.trim()
      if (!utils.isProtocol(protocol)) throw new Error('invalidProtocol')
      if (!url) throw new Error('emptyUrl')
      url = protocol + '://' + url
      utils.testURLRuleValid(url)
      if (!ignoreID && this.isRuleExist(url)) throw new Error('ruleExists')
      // test for duplicated match rule
      this.rules.some((rule) => {
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
      return url
    }
  },
  watch: {
    'form.url': function (newVal) {
      // if form.url is the same with original after change, then
      //    prevent validate on blur, or else
      this.validateRules.url.trigger =
        this.originalForm.url === newVal ? 'none' : 'blur'
    }
  }
}
</script>

<style lang="scss">
.el-form--label-top .el-form-item__label {
  padding-bottom: 0;
}

.path-sep {
  line-height: 32px;
  text-align: center;
}
</style>