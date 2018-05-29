<template>
<el-form ref="ruleForm" :model="form" label-position="left" label-width="106px">
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
    <el-input
      autocorrect="off"
      spellcheck="false"
      v-model="form.redirectUrl"
      placeholder="choose protocol" >
    </el-input>
  </el-form-item>
  <el-form-item size="small" label="Redirect url to" prop="redirectUrl">
    <el-autocomplete
      autocorrect="off"
      spellcheck="false"
      class="inline-input"
      v-model="form.redirectUrl"
      :fetch-suggestions="querySearch"
      placeholder="请输入内容"
      :trigger-on-focus="false"
      @select="handleSelect"
    ></el-autocomplete>
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
  <el-form-item size="small" label="Test Result">
    <el-input
      autocorrect="off"
      spellcheck="false"
      v-model="form.testResult"
      placeholder="choose protocol" >
      <el-button v-if="!ruleID" slot="append" @click="onAddRule">{{$t('addRuleBtn')}}</el-button>
    </el-input>
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
      form: {
        protocol: '*',
        url: '',
        redirectUrl: '',
        testUrl: '',
        testResult: ''
      }
    }
  },
  methods: {
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
    onTestRule () {
      try {
        const router = cutils.preprocessRouter(this.getRouter())
        this.form.testResult = cutils.getTargetUrl(router, this.form.testUrl)
      } catch (e) {
        console.error(e)
      }
    },
    onAddRule () {
      return this.addARule()
    },
    onUpdateRule () {
      return this.addARule(this.ruleID)
    },
    handleSelect (item, oldVal) {
      this.form.redirectUrl = oldVal + item.value + '}'
      return false
    },
    querySearch (words, cb) {
      let result = []
      if (words.slice(-1) !== '{') return cb(result)
      result = [{value: 'aaaa'}, {value: 'bbbb'}]
      cb(result)
    },
    /**
     * add/update a rule
     * @param {String} ruleID specified ruleID to update, add one if ignored
     */
    addARule (ruleID) {
      try {
        let router = this.getRouter()
        const url = router.url
        // test for duplicated match rule
        this.rules.some((rule) => {
          if (ruleID && rule.id === ruleID) return false
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

        if (ruleID) {
          const rule = this.getRuleByID(ruleID)
          router = Object.assign({}, rule, router, {
            updatedAt: Date.now()
          })
        }
        this.addRule(router)
        this.clearForm()
        return true
      } catch (e) {
        console.error(e)
        return false
      }
    },
    getRouter () {
      const matchUrl = this.form.protocol + '://' + this.form.url
      return utils.getRouter(matchUrl, this.form.redirectUrl)
    }
  }
}
</script>

<style lang="scss">
.el-form-item__content .el-autocomplete {
  width: 100%;
}
</style>