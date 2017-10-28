<template>
<div>
  <div class="setting-title">
    {{ $t('catTitle') }} <small>{{ $t('catSubTitle') }}</small>
  </div>
  <div class="item-title">{{ $t('addRuleTitle') }}</div>
  <el-popover
    ref="urlPopover"
    placement="bottom"
    title="标题"
    trigger="focus"
    content="这是一段内容,这是一段内容,这是一段内容,这是一段内容。">
  </el-popover>
  <el-form label-position="top">
    <el-form-item label="Match this url">
      <el-input
        size="small"
        v-model="url"
        @paste.native="onPaste"
        @keyup.native.enter="onAddRule"
        v-popover:urlPopover
        placeholder="choose protocol" >
        <el-select v-model="protocol" slot="prepend" placeholder="">
          <el-option label="*://" value="*"></el-option>
          <el-option label="http://" value="http"></el-option>
          <el-option label="https://" value="https"></el-option>
        </el-select>
      </el-input>
      <el-button size="small" @click="onAddRule">Add rule</el-button>
    </el-form-item>
  </el-form>
  <div class="item-title">{{ $t('manageRule') }}</div>
  <rule-list :type="module" ref="list"></rule-list>
</div>
</template>

<script>
/**
 * rules structure for block/hsts/hotlink/log
 * [{
 *    rule: '*://www.baidu.com/*', // rule text
 *    active: true
 * }]
 */

import utils from '@/options/components/utils'
import RuleList from '@/options/components/rule-list'
import collection from '@/common/collection'
import locales from './locales.json'
export default {
  locales,
  data () {
    return {
      module: '',
      protocol: '',
      url: '',
      rules: []
    }
  },
  components: {
    RuleList
  },
  created() {
    window.pp = this
    this.updateModule()
  },
  methods: {
    onPaste (e) {
      const uri = utils.getUrlFromClipboard(e)
      if (!utils.isProtocol(uri.protocol)) return
      this.protocol = uri.protocol
      this.url = uri.raw.replace(`${uri.protocol}://`, '')
      e.preventDefault()
    },
    onAddRule () {
      const url = this.url.trim().replace(/#.*$/, '')
      const index = this.url.indexOf('/')
      let host = url
      let path = ''
      if (index !== -1) {
        host = url.slice(0, index)
        path = url.slice(index + 1)
      }
      path = path || '*'

      if (!utils.isProtocol(this.protocol)) {
        alert('illegal protocol')
        return
      }
      if (!host || !utils.isIp(host) || utils.isHost(host)) {
        alert('illegal host')
        return
      }
      if (!path || utils.isPath(path)) {
        alert('illegal path')
        return
      }
      const rule = `${this.protocol}://${host}/${path}`
      if (rule.length > 500) {
        alert('rule is too long')
        return
      }
      const isExists = this.isRuleExists(rule)
      if (isExists) {
        alert('rule duplicated in two ways')
        return
      }

      // affect many websites
      if (host === '*' && ['block', 'hsts'].indexOf(this.module) !== -1) {
        this.$confirm('* host will disable your web browser', 'warning', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.addRule(rule)
        }).catch(() => {
          console.log('rule')
        });
      } else {
        this.addRule(rule)
      }
    },
    updateModule () {
      this.module = this.$route.path.slice(1).toLowerCase()
    },
    addRule (rule) {
      this.$ref.list.addRule({
        rule,
        active: true        
      })
    },
    validateRule (rule) {

    },
    isRuleExists (rule) {
      let len = this.rules.length
      while (len--) {
        const r = this.rules[len].rule
        if (utils.isSubRule(r, rules)) {
          // rule covered by r
          return { code: 1, rule: r }
        }
        if (utils.isSubRule(rule, r)) {
          // rule covers r
          return { code: 2, rule: r }
        }
      }
      return 0
    }
  },
  watch: {
    $route () {
      this.updateModule()
      this.$el.classList.add('slide-enter')
      setTimeout(() => {
        this.$el.classList.add('slide-enter-active')
        this.$el.classList.remove('slide-enter')
      }, 0)
      setTimeout(() => {
        this.$el.classList.remove('slide-enter-active')
      }, 500)
    }
  }
};
</script>

<style lang="scss">
@import '~@/common/base';
</style>
