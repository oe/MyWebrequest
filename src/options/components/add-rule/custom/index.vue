<template>
<el-form ref="ruleForm" :model="form" label-position="left" label-width="106px">
  <el-form-item size="small" :label="$t('matchLbl')">
    <el-input
      v-model="form.url"
      @paste.native="onPaste"
      @keyup.native.enter="onAddRule"
      ref="firstInput"
      placeholder="choose protocol" >
      <el-select v-model="form.protocol" slot="prepend" placeholder="">
        <el-option label="*://" value="*"></el-option>
        <el-option label="http://" value="http"></el-option>
        <el-option label="https://" value="https"></el-option>
      </el-select>
    </el-input>
  </el-form-item>

  <el-form-item size="small" label="Redirect url to">
    <el-input
      v-model="form.redirectUrl"
      placeholder="choose protocol" >
    </el-input>
  </el-form-item>

  <el-form-item size="small" label="Test your rule">
    <el-input
      v-model="form.testUrl"
      placeholder="choose protocol" >
      <el-button slot="append" @click="onTestRule">{{$t('testRule')}}</el-button>
    </el-input>
  </el-form-item>
  <el-form-item size="small" label="Test Result">
    <el-input
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
          const matchs = rule.matchUrl.match(/^([^:]+):\/\/(.+)$/)
          this.form.protocol = matchs[1]
          this.form.url = matchs[2]
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
      try {
        const router = this.getRouter()
        this.addRule(router)
        this.clearForm()
      } catch (e) {
        console.error(e)
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
</style>