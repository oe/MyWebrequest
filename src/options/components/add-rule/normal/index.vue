<template>
<el-form label-position="top" :model="form" ref="ruleForm">
  <el-form-item size="small" :prop="form.host" :label="$t('matchLbl')" :error="errorMsg">
    <el-col :span="10">
      <el-input
        v-model="form.host"
        @input="onFormChange"
        @paste.native="onPaste"
        @keyup.native.enter="onAddRule"
        ref="firstInput"
        v-popover:urlPopover
        placeholder="host, required, paste a url here" >
        <el-select v-model="form.protocol" slot="prepend" :disabled="disableProtocol">
          <el-option label="*://" value="*"></el-option>
          <el-option label="http://" value="http"></el-option>
          <el-option label="https://" value="https"></el-option>
        </el-select>
      </el-input>
    </el-col>
    <el-col :span="1" class="path-sep">/</el-col>
    <el-col :span="13">
      <el-input
        size="small"
        v-model="form.pathname"
        @input="onFormChange"
        @paste.native="onPaste"
        @keyup.native.enter="onAddRule"
        placeholder="pathname and querystring, optional" >
        <el-button v-if="!ruleID" slot="append" @click="onAddRule">{{$t('addRuleBtn')}}</el-button>
      </el-input>
    </el-col>
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
        host: '',
        pathname: ''
      },
      // 错误信息
      errorMsg: '',
      etid: 0,
      isHiding: false
    }
  },
  created () {
    this.updateModule()
  },
  mounted () {
    window.ff = this.$refs.ruleForm
  },
  methods: {
    onAddRule () {
      try {
        const url = this.validateRule(this.form.protocol, this.form.host, this.form.pathname)
        this.addRule(url)
        this.resetForm()
      } catch (e) {
        this.showInputError('Same rule has already added')
        console.error('failed', e)
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
    updateModule () {
      const isHsts = this.module === 'hsts'
      this.disableProtocol = isHsts
      this.protocol = isHsts ? 'http' : '*'
    },
    validateRule (protocol, host, path) {
      path = path.trim() || '*'
      host = host.trim()
      if (!utils.isProtocol(protocol)) throw new Error('invalidProtocol')
      if (!host) throw new Error('emptyHost')
      const url = `${protocol}://${host}/${path}`
      utils.testURLRuleValid(url)
      if (this.isRuleExist(url)) throw new Error('ruleExists')
      this.rules.some((rule) => {
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
    $route () {
      this.updateModule()
    }
  }
}
</script>

<style lang="scss">
.path-sep {
  text-align: center;
}
</style>