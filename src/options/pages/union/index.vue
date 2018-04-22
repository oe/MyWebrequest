<template>
<div>
  <div class="setting-title">
    {{ catTitle }} <small v-html="$t(module+'Desc')"></small>
  </div>
  <el-checkbox
    v-model="isEnabled"
    @change="onFeatureSatusChange">{{$t('enaFeatureLbl')}}</el-checkbox>
  
  <div class="item-title">{{ $t('addRuleTitle') }}</div>
  <component :is="formType"></component>
  <rule-list :type="module" ref="list"></rule-list>
</div>
</template>

<script>
import utils from '@/options/components/utils'
import RuleList from '@/options/components/rule-list'
import collection from '@/common/collection'
import CustomForm from '@/options/components/add-rule/custom'
import NormalForm from '@/options/components/add-rule/normal'
import locales from './locales.json'
export default {
  locales,
  data () {
    return {
      module: '',
      protocol: '',
      url: '',
      isEnabled: false,
      rules: []
    }
  },
  components: {
    RuleList,
    CustomForm,
    NormalForm
  },
  created () {
    this.updateModule()
  },
  computed: {
    catTitle () {
      return this.module.charAt(0).toUpperCase() + this.module.slice(1)
    },
    formType () {
      return this.module === 'custom' ? 'CustomForm' : 'NormalForm'
    }
  },
  methods: {
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
        })
      } else {
        this.addRule(rule)
      }
    },
    onFeatureSatusChange () {
      const onoff = collection.get('onoff')
      onoff[this.module] = this.isEnabled
      collection.save('onoff', onoff)
    },
    updateModule () {
      this.module = this.$route.path.slice(1).toLowerCase()
      this.isEnabled = !!collection.get('onoff')[this.module]
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
        if (utils.isSubRule(r, this.rules)) {
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
}
</script>

<style lang="scss">
@import '~@/common/base';
</style>
