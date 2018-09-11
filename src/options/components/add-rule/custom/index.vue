<template>
<el-form ref="ruleForm" :model="form" :rules="validateRules" label-position="left" label-width="106px">
  <el-form-item size="small" :label="$t('matchLbl')" prop="url">
    <el-input
      v-model="form.matchURL"
      @paste.native="onPaste"
      @keyup.native.enter="onAddRule"
      ref="firstInput"
      autocorrect="off"
      spellcheck="false"
      placeholder="choose protocol" >
      <el-switch v-model="form.useReg" slot="append" active-text="use regexp"></el-switch>
    </el-input>
  </el-form-item>

  <el-form-item size="small" label="Redirect url to" prop="redirectURL">
    <el-autocomplete
      autocorrect="off"
      spellcheck="false"
      class="inline-input"
      ref="redirectInput"
      v-model="form.redirectURL"
      :fetch-suggestions="querySearch"
      placeholder="choose protocol"
      :debounce="0"
      :trigger-on-focus="false"
      @keyup.native="onRedirectKeyup"
      @select="handleSelect"
    >
      <template slot-scope="{ item }">
        <div class="val">{{ item.value }}</div>
        <div class="desc" v-if="item.label">{{ item.label }}</div>
      </template>
    </el-autocomplete>
  </el-form-item>

  <el-form-item size="small" label="Test your rule" prop="testUrl">
    <el-input
      autocorrect="off"
      spellcheck="false"
      v-model="form.testUrl"
      placeholder="choose protocol" >
      <el-button slot="append" @click="onTestRule">{{$t('testRule')}}</el-button>
    </el-input>
  </el-form-item>
  <el-form-item size="small" prop="testResult" label="Test Result" class="form-item-testresult">
    <div class="url-result">
      <a class="success-tip" :href="form.testResult" target="_blank">{{form.testResult}}</a>
      <span class="failed-tip">
        Rule not match
      </span>
      <span class="normal-tip">
        Please test your rule before add, you can add your rule after passed test
      </span>
    </div>
    <el-button v-if="!ruleID" @click="onAddRule">{{$t('addRuleBtn')}}</el-button>
  </el-form-item>

</el-form>
</template>

<script>
import utils from '@/options/components/helper/utils'
import validate from '@/options/components/helper/validate'
import cstRule from '@/options/components/helper/custom-rule'
import cutils from '@/common/utils'
import mixin, { mergeLang } from '../common-mixin'
import locales from './locales.json'
const lang = mergeLang(locales)

export default {
  name: 'custom',
  locales: lang,
  mixins: [mixin],
  data () {
    return {
      redirectInput: null,
      selectionStart: 0,
      form: {
        useReg: false,
        matchURL: 'https://itunes.apple.com/us/*',
        redirectURL: 'https://itunes.apple.com/cn/*',
        testUrl: 'https://itunes.apple.com/us/app/wechat/id414478124?mt=8',
        testResult: ''
      },
      validateRules: {
        url: { validator: this.validateMatchURL, trigger: 'none' },
        redirectURL: { validator: this.validateRedirectURL, trigger: 'none' },
        testUrl: { validator: this.validateTestURL, trigger: 'none' },
        testResult: { validator: this.validateTestResult, trigger: 'none' }
      },
      parms: []
    }
  },
  mounted () {
    this.redirectInput = this.$refs.redirectInput.$el.querySelector('input')
  },
  methods: {
    validateMatchURL (rule, value, cb) {
      try {
        console.log('validateMatchURL', value)
        const matchURL = this.form.matchURL.trim()
        validate.checkCustomMatchRule(matchURL)
        const matchMeta = cstRule.getMatchMeta(matchURL, true)
        const ignoreID = this.isUpdate && this.ruleID
        if (!ignoreID && this.isRuleExist(matchMeta.url)) {
          throw new Error('ruleExists')
        }
        this.isRuleIntersect(matchMeta.url, ignoreID)
        cb()
      } catch (e) {
        console.log(e)
        // return cb(new Error(this.$t('qrMakeMacBtn')))
        return cb(e)
      }
    },
    validateRedirectURL (rule, value, cb) {
      try {
        validate.checkCustomRedirectRule(value, this.form.matchURL)
        return cb()
      } catch (e) {
        cb(e)
      }
    },
    validateTestURL (rule, value, cb) {
      console.log('validateTestURL', value)
      try {
        validate.checkURL(value)
        cb()
      } catch (error) {
        cb(error)
      }
    },
    validateTestResult (rule, value, cb) {
      let router
      try {
        router = cutils.preprocessRouter(this.getRouter())
      } catch (e) {
        return cb(e)
      }
      let result = validate.isURLMatchPattern(this.form.testUrl, router.url)
      if (result) {
        result = cutils.getTargetUrl(router, this.form.testUrl)
      }
      if (!result) return cb(new Error('testUrlNotMatch'))
      this.form.testResult = result
      cb()
    },
    resetForm () {
      this.clearForm()
      if (this.ruleID) {
        const rule = this.getRuleByID(this.ruleID)
        if (rule) {
          const matchs = utils.getURLParts(rule.matchUrl)
          this.form.protocol = matchs[1]
          this.form.url = matchs[2] + matchs[3] + (matchs[4] || '')
          this.form.redirectURL = rule.redirectURL
        }
      }
    },
    onRedirectKeyup () {
      // trigger redirectuRL autosuggestion
      this.$refs.redirectInput.debouncedGetData(this.form.redirectURL)
    },
    onTestRule () {
      console.log('teset rule')
      this.$refs.ruleForm.validate()
    },
    async onAddRule () {
      this.isUpdate = false
      const isValid = await this.$refs.ruleForm.validate()
      this.isUpdate = true
      if (!isValid) return
      this.addARule()
    },
    async onUpdateRule () {
      this.isUpdate = true
      const isValid = await this.$refs.ruleForm.validate()
      if (!isValid) return
      this.addARule(this.ruleID)
    },
    handleSelect (item, oldVal) {
      const needCloseBracket =
        oldVal.length === this.selectionStart ||
        oldVal[this.selectionStart] !== '}'
      let str = oldVal
        .slice(0, this.selectionStart)
        .replace(/(?<={)([^{}]*)$/, '')
      // move text cursor position
      let curPos
      if (item.value === '*') {
        str = str.slice(0, -1) + item.value + ''
        curPos = str.length
        // no need of bracket, then remove the close }
        str += oldVal.slice(this.selectionStart + (needCloseBracket ? 0 : 1))
      } else {
        str += item.value
        if (needCloseBracket) str += '}'
        curPos = str.length + (needCloseBracket ? 0 : 1)
        str += oldVal.slice(this.selectionStart)
      }
      this.form.redirectURL = str
      // const curPos = str.length + 1
      setTimeout(() => {
        this.redirectInput.setSelectionRange(curPos, curPos)
      }, 20)
      return false
    },
    querySearch (words, cb) {
      const result = []
      this.selectionStart = this.redirectInput.selectionStart
      // cursor position not at the end of string, or not in front of any alphanumeric
      const letterAfterCursor = words[this.selectionStart]
      if (
        this.selectionStart !== words.length &&
        /\w/.test(letterAfterCursor)
      ) {
        return cb(result)
      }
      // no match {
      if (!/(?<={)([^{}]*)$/.test(words.slice(0, this.selectionStart))) {
        return cb(result)
      }
      const searchWords = RegExp.$1.trim()
      cb(this.getUrlParams(searchWords))
    },
    getUrlParams (kwd) {
      let result = this.getAllAvailableParams()
      if (kwd) {
        result = result.filter(itm => itm.value.includes(kwd))
      }
      return result
    },
    getAllAvailableParams () {
      let params = []
      try {
        validate.checkCustomMatchParams(this.form.matchURL)
        params = utils
          .getMatchRuleParams(this.form.matchURL, this.form.useReg)
          .map(v => {
            const result = { value: v }
            if (v === '*') {
              result.label = 'anything after the first star in path'
            }
            return result
          })
      } catch (e) {
        console.warn('[autosuggestion] match url is invalid', e)
      }
      const result = params.concat(
        utils.RESERVED_HOLDERS.map(k => {
          return {
            value: k,
            label: this.$t('param_' + k)
          }
        })
      )
      return result
    },
    /**
     * add/update a rule
     * @param {String} ruleID specified ruleID to update, add one if ignored
     */
    async addARule (ruleID) {
      let router = this.getRouter()
      if (ruleID) {
        const rule = this.getRuleByID(ruleID)
        router = Object.assign({}, rule, router, {
          updatedAt: Date.now()
        })
      }
      this.addRule(router)
      this.clearForm()
      return true
    },
    getRouter () {
      try {
        return cstRule.getRouter(this.form.matchURL, this.form.redirectURL)
      } catch (error) {
        console.log(error)
      }
    }
  }
}
</script>

<style lang="scss">
.el-form-item__content > .el-input {
  width: 100%;
}
.el-form-item__content .el-autocomplete {
  width: 100%;
}

.el-autocomplete-suggestion li {
  display: flex;

  .desc {
    color: #aaa;
    margin-left: 20px;
  }
}
</style>