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
  <el-form-item size="small" label="Test Result" class="form-item-testresult">
    <div class="url-result">
      <a :href="form.testResult" target="_blank">{{form.testResult}}</a>
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
      }
    }
  },
  mounted () {
    this.redirectInput = this.$refs.redirectInput.$el.querySelector('input')
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
    onRedirectKeyup () {
      // trigger redirecturl autosuggestion
      this.$refs.redirectInput.debouncedGetData(this.form.redirectUrl)
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
.el-form-item__content>.el-input {
  width: 100%;
}
.el-form-item__content .el-autocomplete {
  width: 100%;
}
.url-result {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  /* autoprefixer: ignore next */
  -webkit-box-orient: vertical;
}
.el-autocomplete-suggestion li {
  display: flex;

  .desc {
    color: #aaa;
    margin-left: 20px;
  }
}
</style>