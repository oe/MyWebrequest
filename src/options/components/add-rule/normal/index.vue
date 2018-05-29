<template>
<el-form label-position="top" :model="form" ref="ruleForm">
  <el-form-item :label="$t('matchLbl')" :error="errorMsg">
    <el-col :span="10">
      <el-form-item prop="host" required>
        <el-input
          size="small"
          v-model="form.host"
          @input="onFormChange"
          @paste.native="onPaste"
          @keyup.native.enter="onAddRule"
          ref="firstInput"
          autocorrect="off"
          spellcheck="false"
          v-popover:urlPopover
          placeholder="host, required, paste a url here" >
          <el-select v-model="form.protocol" slot="prepend" :disabled="disableProtocol">
            <el-option label="*://" value="*"></el-option>
            <el-option label="http://" value="http"></el-option>
            <el-option label="https://" value="https"></el-option>
          </el-select>
        </el-input>
      </el-form-item>
    </el-col>
    <el-col :span="1" class="path-sep">/</el-col>
    <el-col :span="13">
      <el-form-item prop="pathname" required>
        <el-input
          size="small"
          autocorrect="off"
          spellcheck="false"
          v-model="form.pathname"
          @input="onFormChange"
          @paste.native="onPaste"
          @keyup.native.enter="onAddRule"
          placeholder="pathname and querystring, optional" >
          <el-button v-if="!ruleID" slot="append" @click="onAddRule">{{$t('addRuleBtn')}}</el-button>
        </el-input>
      </el-form-item>
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
  mounted () {
    window.ff = this.$refs.ruleForm
  },
  methods: {
    async onAddRule () {
      const isValid = await this.$refs.ruleForm.validate()
      console.warn('isValid', isValid)
      if (isValid) this.addARule()
    },
    onUpdateRule () {
      return this.addARule(this.ruleID)
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
            this.form.host = parts[2]
            // remove leading / in pathname
            this.form.pathname = parts[3].replace(/^\//, '') + (parts[4] || '')
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
      const host = data.host.trim()
      const path = data.pathname.trim() || '*'
      if (!utils.isProtocol(protocol)) throw new Error('invalidProtocol')
      if (!host) throw new Error('emptyHost')
      const url = `${protocol}://${host}/${path}`
      utils.testURLRuleValid(url)
      if (this.isRuleExist(url)) throw new Error('ruleExists')
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