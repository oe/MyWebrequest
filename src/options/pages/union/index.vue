<template>
<div>
  <div class="setting-title">
    {{ catTitle }} <small v-html="$t(module+'Desc')"></small>
  </div>
  <el-checkbox
    v-model="isEnabled"
    :disabled="disabled"
    @change="onFeatureSatusChange">{{$t('enaFeatureLbl')}}</el-checkbox>
  
  <div class="item-title">{{ $t('addRuleTitle') }}</div>
  <component :is="formType"></component>
  <rule-list :type="module" ref="list"></rule-list>
</div>
</template>

<script>
import RuleList from '@/options/components/rule-list'
import collection from '@/common/collection'
import CustomForm from '@/options/components/add-rule/custom'
import NormalForm from '@/options/components/add-rule/normal'
import { mapState } from 'vuex'
import locales from './locales.json'
export default {
  locales,
  data () {
    return {
      protocol: '',
      url: '',
      isEnabled: false
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
    ...mapState({
      disabled: state => !state.rules.length,
      module: state => state.module
    }),
    catTitle () {
      return this.module.charAt(0).toUpperCase() + this.module.slice(1)
    },
    formType () {
      return this.module === 'custom' ? 'CustomForm' : 'NormalForm'
    }
  },
  methods: {
    onFeatureSatusChange () {
      const onoff = collection.get('onoff')
      onoff[this.module] = this.isEnabled
      console.log('this.module', this.module, this.isEnabled, onoff)
      collection.save('onoff', onoff)
    },
    updateModule () {
      this.isEnabled = !!collection.get('onoff')[this.module]
    }
  },
  watch: {
    disabled (val) {
      this.isEnabled = false
    },
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
