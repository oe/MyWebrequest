<template>
<el-form  label-position="top" :model="form" :rules="validateRules" ref="ruleForm">
  <el-form-item class="form-item-url" prop="matchURL" size="small">
    <template slot="label">
      <div slot="label">
        {{$t('matchLbl')}}
      </div>
      <el-checkbox v-model="needTest">I'd like to test my rule</el-checkbox>      
    </template>
    <el-input
      v-model="form.matchURL"
      @paste.native="onPaste"
      ref="firstInput"
      autocorrect="off"
      spellcheck="false"
      v-popover:urlPopover
      :placeholder="$t('match-rule-ph')" >
    </el-input>
  </el-form-item>
  <el-form-item class="form-item-url" prop="ua" size="small">
    <template slot="label">
      <div slot="label">
        <!-- {{$t('matchLbl')}} -->
        Change UA to
      </div>
    </template>
    <el-input
      v-model="form.ua"
      @keyup.native.enter="onAddRule"
      ref="firstInput"
      autocorrect="off"
      spellcheck="false"
      v-popover:urlPopover
      :placeholder="$t('match-rule-ph')" >
      <el-button v-if="!ruleID && !needTest" slot="append" @click="onAddRule">
        {{$t('addRuleBtn')}}
      </el-button>
    </el-input>
  </el-form-item>
  <el-form-item v-show="needTest" size="small" label="Test your rule" prop="testURL">
    <el-input
      autocorrect="off"
      spellcheck="false"
      v-model="form.testURL"
      :placeholder="$t('test-url-ph')" >
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
      <span class="success-tip">
        Test passed
      </span>
      <span class="failed-tip">
        Failed to test
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
import validate from '@/options/components/helper/validate'
import utils from '@/options/components/helper/utils'
import { mapActions } from 'vuex'
import mixin, { mergeLang } from '../common-mixin'
import locales from './locales.json'
const lang = mergeLang(locales)

export default {
  locales: lang,
  mixins: [mixin],
  data () {
    return {
      disableProtocol: false,
      form: {
        matchURL: '',
        ua: '',
        testURL: '',
        testResult: ''
      },
      validateRules: {
        // by default, validator wont trigger on input blur
        matchURL: { validator: this.validateURL, trigger: 'none' },
        testURL: { validator: this.validateTestURL, trigger: 'none' },
        testResult: { validator: this.validateTestResult, trigger: 'none' }
      },
      needTest: false,
      etid: 0,
      isHiding: false
    }
  },
  // components: {TestResult},
  methods: {
    ...mapActions(['toggleRuleTest']),
    validateURL (rule, value, cb) {
      try {
        this.validateRule(this.form, this.isUpdate && this.ruleID)
        cb()
      } catch (e) {
        return cb(e)
      }
    },
    validateTestResult (rule, value, cb) {
      if (!this.needTest) return cb()
      try {
        this.validateRule(this.form, this.isUpdate && this.ruleID)
        this.checkTestURL(this.form.testURL)
        const pattern = this.form.matchURL.trim()
        const isMatch = validate.isURLMatchPattern(this.form.testURL, pattern)
        if (!isMatch) throw utils.createError('testurl-not-match-rule')
        cb()
      } catch (e) {
        cb(e)
      }
    },
    onTestRule () {
      console.log('on test rule')
      this.$refs.ruleForm.validate()
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
          url = Object.assign({}, rule, { url, updatedAt: Date.now() })
        }
        this.addRule(url)
        this.clearForm()
        return true
      } catch (e) {
        console.error('failed', e)
        // this.showInputError('Same rule has already added')
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
          this.form.matchURL = rule.url
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
      let url = data.matchURL.trim()
      if (!url) {
        throw utils.createError('rule-empty')
      }
      if (this.module === 'hsts') {
        if (/^(\w+:\/\/)/.test(url)) {
          throw utils.createError('should-haveno-protocol', RegExp.$1)
        }
        url = 'http://' + url
      }
      validate.checkChromeRule(url)
      if (!ignoreID && this.isRuleExist(url)) throw new Error('ruleExists')
      // test for duplicated match rule
      this.isRuleIntersect(url, ignoreID)
      return url
    }
  },
  watch: {
    needTest (newVal) {
      this.toggleRuleTest({ module: this.module, isOn: newVal })
    }
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

  .el-checkbox {
    font-weight: normal;
  }
}

.form-item-testresult {
  .url-result {
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 32px;
    word-break: break-all;
    padding: 0 4px;
    -webkit-line-clamp: 2;
    -webkit-box-pack: center;
    -webkit-box-orient: vertical;
  }

  .normal-tip {
    color: #aaa;
    font-style: italic;
  }

  .success-tip,
  .failed-tip {
    display: none;
  }

  &.is-success {
    .success-tip {
      color: #67c23a;
      display: inline-block;
    }
    .normal-tip {
      display: none;
    }
  }

  &.is-error {
    .failed-tip {
      color: #f56c6c;
      display: inline-block;
    }
    .normal-tip {
      display: none;
    }
  }

  .el-form-item__error {
    display: none;
  }
}
</style>