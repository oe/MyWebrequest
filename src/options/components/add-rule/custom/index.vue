<template>
<el-form ref="ruleForm" :model="form" :rules="validateRules" label-position="left" label-width="106px">
  <el-form-item size="small" :label="$t('matchLbl')" prop="url">
    <el-input
      v-model="form.url"
      @paste.native="onPaste"
      @keyup.native.enter="onAddRule"
      ref="firstInput"
      autocorrect="off"
      spellcheck="false"
      placeholder="choose protocol" >
      <el-select v-model="form.protocol" slot="prepend">
        <el-option label="*://" value="*"></el-option>
        <el-option label="http://" value="http"></el-option>
        <el-option label="https://" value="https"></el-option>
      </el-select>
    </el-input>
  </el-form-item>

  <el-form-item size="small" label="Redirect url to" prop="redirectUrl">
    <el-autocomplete
      autocorrect="off"
      spellcheck="false"
      class="inline-input"
      ref="redirectInput"
      v-model="form.redirectUrl"
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
import utils from '@/options/components/utils'
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
        protocol: '*',
        url: '',
        redirectUrl: '',
        testUrl: '',
        testResult: ''
      },
      validateRules: {
        url: {validator: this.validateURL, trigger: 'none'},
        redirectUrl: {validator: this.validateRedirectURL, trigger: 'none'},
        testUrl: {validator: this.validateTestURL, trigger: 'none'},
        testResult: {validator: this.validateTestResult, trigger: 'none'}
      },
      parms: []
    }
  },
  mounted () {
    this.redirectInput = this.$refs.redirectInput.$el.querySelector('input')
  },
  methods: {
    validateURL (rule, value, cb) {
      try {
        console.log('validateURL', value)
        let {url, protocol} = this.form
        url = url.trim()
        if (!utils.isProtocol(protocol)) throw new Error('invalidProtocol')
        if (!url) throw new Error('emptyUrl')
        const matchUrl = protocol + '://' + url
        const router = utils.getRouter(matchUrl)
        const ignoreID = this.isUpdate && this.ruleID
        if (!ignoreID && this.isRuleExist(router.url)) throw new Error('ruleExists')
        this.isRuleIntersect(router.url, ignoreID)
        utils.hasReservedWord(router)
        utils.isKwdsUniq(router)
        cb()
      } catch (e) {
        console.log(e)
        // return cb(new Error(this.$t('qrMakeMacBtn')))
        return cb(e)
      }
    },
    validateRedirectURL (rule, value, cb) {
      try {
        const matchURL = this.form.protocol + '://' + this.form.url
        utils.isRedirectURLValid(value, matchURL)
        return cb()
      } catch (e) {
        cb(e)
      }
    },
    validateTestURL (rule, value, cb) {
      console.log('validateTestURL', value)
      if (utils.isURL(value)) return cb()
      cb(new Error('invalidURL'))
    },
    validateTestResult (rule, value, cb) {
      let router
      try {
        router = cutils.preprocessRouter(this.getRouter())
      } catch (e) {
        return cb(new Error('ruleInvalid'))
      }
      let result = utils.isURLMatchPattern(this.form.testUrl, router.url)
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
          this.form.redirectUrl = rule.redirectUrl
        }
      }
    },
    onRedirectKeyup () {
      // trigger redirecturl autosuggestion
      this.$refs.redirectInput.debouncedGetData(this.form.redirectUrl)
    },
    onTestRule () {
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
      const needCloseBracket = oldVal.length === this.selectionStart
      let str = oldVal.slice(0, this.selectionStart).replace(/(?<={)([^{}]*)$/, '')
      str += item.value
      if (needCloseBracket) str += '}'
      // move text cursor position
      const curPos = str.length + 1
      setTimeout(() => {
        this.redirectInput.setSelectionRange(curPos, curPos)
      }, 20)
      str += oldVal.slice(this.selectionStart)
      this.form.redirectUrl = str
      return false
    },
    querySearch (words, cb) {
      const result = []
      this.selectionStart = this.redirectInput.selectionStart
      if (this.selectionStart !== words.length && words[this.selectionStart] !== '}') return cb(result)
      // no match {
      if (!/(?<={)([^{}]*)$/.test(words.slice(0, this.selectionStart))) return cb(result)
      const searchWords = RegExp.$1.trim()
      cb(this.getUrlParams(searchWords))
    },
    getUrlParams (kwd) {
      let result = this.getAllAvailableParams()
      if (kwd) {
        result = result.filter((itm) => itm.value.includes(kwd))
      }
      return result
    },
    getAllAvailableParams () {
      const result = utils.RESERVED_HOLDERS.map((k) => {
        return {
          value: k,
          label: this.$t('param_' + k)
        }
      })
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
      const matchUrl = this.form.protocol + '://' + this.form.url
      return utils.getRouter(matchUrl, this.form.redirectUrl)
    }
  }
}
</script>

<style lang="scss">
.el-form-item__content>.el-input {
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