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
      v-model="form.matchURL"
      @paste.native="onPaste"
      @keyup.native.enter="onAddRule"
      ref="firstInput"
      autocorrect="off"
      spellcheck="false"
      v-popover:urlPopover
      placeholder="url, required, paste a url here" >
      <template slot="prepend" v-if="module==='hsts'">http://</template>
      <el-button v-if="!ruleID && !needTest" slot="append" @click="onAddRule">
        {{$t('addRuleBtn')}}
      </el-button>

    </el-input>
  </el-form-item>
  <el-form-item v-show="needTest" size="small" label="Test your rule" prop="testUrl">
    <el-input
      autocorrect="off"
      spellcheck="false"
      v-model="form.testURL"
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
import { mapActions } from 'vuex'
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
        matchURL: '',
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
  mounted () {
    window.ff = this
  },
  // components: {TestResult},
  methods: {
    ...mapActions(['toggleRuleTest']),
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
      try {
        if (!this.needTest || validate.checkURL(value)) return cb()
      } catch (error) {
        cb(error)
      }
    },
    validateTestResult (rule, value, cb) {
      if (!this.needTest) cb()
      // this.isUpdate = true
      // const isValid = this.$refs.ruleForm.validate()
      // if (!isValid) return
      const pattern = this.form.matchURL.trim()
      const isMatch = validate.isURLMatchPattern(this.form.testURL, pattern)
      isMatch ? cb() : cb(new Error('notMatch'))
      // console.log('isMatch', isMatch)
    },
    async onTestRule () {
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
    line-height: 1.2;
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