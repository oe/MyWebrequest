<template>
<el-form  label-position="top" :model="form" :rules="validateRules" ref="ruleForm">
  <el-form-item class="form-item-url" prop="url" size="small">
    <template slot="label">
      <div slot="label">
        {{$t('matchLbl')}}
      </div>
      <el-checkbox v-model="needTest">I'd like to test my rule</el-checkbox>      
    </template>
    <el-input
      v-model="form.url"
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
      <el-button v-if="!ruleID && !needTest" slot="append" @click="onAddRule">
        {{$t('addRuleBtn')}}
      </el-button>

    </el-input>
  </el-form-item>
  <el-form-item v-show="needTest" size="small" label="Test your rule" prop="testUrl">
    <el-input
      autocorrect="off"
      spellcheck="false"
      v-model="form.testUrl"
      placeholder="choose protocol" >
      <el-button slot="append" @click="onTestRule">{{$t('testRule')}}</el-button>
    </el-input>
  </el-form-item>
<!--   <el-popover
    ref="urlPopover"
    placement="bottom"
    title="标题"
    trigger="focus"
    content="这是一段内容,这是一段内容,这是一段内容,这是一段内容。">
  </el-popover> -->
  <el-form-item v-show="needTest" size="small" prop="testResult" label="Test Result" class="form-item-testresult">
    <div class="url-result">
      <template v-if="form.testResult">
        <a :href="form.testResult" target="_blank">{{form.testResult}}</a>
      </template>
      <template v-else>
        Please test your rule before add, you can add your rule after passed test
      </template>
    </div>
    <el-button v-if="!ruleID" @click="onAddRule">{{$t('addRuleBtn')}}</el-button>
  </el-form-item>
</el-form>
</template>

<script>
import utils from '@/options/components/utils'
// import TestResult from '@/options/components/test-result'
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
        url: '',
        testUrl: '',
        testResult: ''
      },
      validateRules: {
        // by default, validator wont trigger on input blur
        url: {validator: this.validateURL, trigger: 'none'},
        testUrl: {validator: this.validateTestURL, trigger: 'none'},
        testResult: {validator: this.validateTestResult, trigger: 'none'}
      },
      needTest: false,
      etid: 0,
      // set to true before update a rule in dialog
      //   and will skip duplicated rule check
      isUpdate: true,
      isHiding: false
    }
  },
  mounted () {
    window.ff = this
  },
  // components: {TestResult},
  methods: {
    validateURL (rule, value, cb) {
      try {
        console.log('validateURL', value)
        this.validateRule(this.form, this.isUpdate && this.ruleID)
        cb()
      } catch (e) {
        console.log(e)
        // return cb(new Error(this.$t('qrMakeMacBtn')))
        return cb(e)
      }
    },
    validateTestURL (rule, value, cb) {
      console.log('validateTestURL', value)
      if (!this.needTest || utils.isURL(value)) return cb()
      cb(new Error('invalidURL'))
    },
    validateTestResult (rule, value, cb) {
      if (!this.needTest) cb()
      // this.isUpdate = true
      // const isValid = this.$refs.ruleForm.validate()
      // if (!isValid) return
      const pattern = this.form.protocol + '://' + this.form.url
      const isMatch = utils.isURLMatchPattern(this.form.testUrl, pattern)
      isMatch ? cb() : cb(new Error('notMatch'))
      // console.log('isMatch', isMatch)
    },
    async onTestRule () {
      this.$refs.ruleForm.validate()
      // this.isUpdate = true
      // const isValid = this.$refs.ruleForm.validate()
      // if (!isValid) return
      // const pattern = this.form.protocol + '://' + this.form.url
      // const isMatch = utils.isURLMatchPattern(this.form.testUrl, pattern)
      // console.log('isMatch', isMatch)
    },
    async onAddRule () {
      this.isUpdate = false
      const isValid = await this.$refs.ruleForm.validate()
      this.isUpdate = true
      console.warn('isValid', isValid)
      if (isValid) return this.addARule()
    },
    async onUpdateRule () {
      this.isUpdate = true
      const isValid = await this.$refs.ruleForm.validate()
      if (isValid) return this.addARule(this.ruleID)
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
    // form: {
    //   handler (newVal) {
    //     const original = this.originalForm
    //     const isRuleChanged = newVal.protocol !== original.protocol ||
    //       newVal.url !== original.url
    //     console.log('form.url change', this.originalForm, newVal)
    //     const trigger = isRuleChanged ? 'change' : 'none'
    //     console.log('trigger', trigger)
    //     // if form.url is the same with original after change, then
    //     //    prevent validate on blur, or else
    //     this.validateRules.url.trigger = trigger
    //     if (trigger === 'none') this.$refs.ruleForm.clearValidate()
    //   },
    //   deep: true
    // }
  }
}
</script>

<style lang="scss">
.el-form--label-top .el-form-item__label {
  padding-bottom: 0;
}

.form-item-url .el-form-item__label {
  display: flex;
  justify-content: space-between;

  .el-checkbox { font-weight: normal; }
}

.url-result {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  word-break: break-all;
  padding: 0 4px;
  -webkit-line-clamp: 2;
  -webkit-box-pack: center;
  -webkit-box-orient: vertical;
}
</style>