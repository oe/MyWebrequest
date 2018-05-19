<template>
<div>
  <titlebar></titlebar>
  <el-checkbox
    v-model="isEnabled"
    :disabled="disabled"
    @change="onFeatureSatusChange">{{$t('enaFeatureLbl')}}
    <span v-show="this.disabled">
      (<span v-show="this.ruleCount">{{$t('needARuleEnable')}}</span><span v-show="!this.ruleCount">{{$t('addARule2Enable')}}</span>)
    </span>
  </el-checkbox>
  
  <div class="item-title">{{ $t('addRuleTitle') }}</div>
  <component :is="formType" ref="form"></component>
  <rule-list :type="module" ref="list"></rule-list>
</div>
</template>

<script>
import RuleList from '@/options/components/rule-list'
import collection from '@/common/collection'
import CustomForm from '@/options/components/add-rule/custom'
import NormalForm from '@/options/components/add-rule/normal'
import { mapState, mapGetters } from 'vuex'
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
      module: state => state.module
    }),
    ...mapGetters({
      ruleCount: 'ruleCount',
      disabled: 'hasNoEnabledRule'
    }),
    formType () {
      return this.module === 'custom' ? 'CustomForm' : 'NormalForm'
    }
  },
  methods: {
    onFeatureSatusChange () {
      const onoff = collection.get('onoff')
      onoff[this.module] = this.isEnabled
      collection.save('onoff', onoff)
    },
    updateModule () {
      this.isEnabled = !!collection.get('onoff')[this.module]
      this.$nextTick(() => {
        try {
          this.$refs.form.$refs.firstInput.focus()
        } catch (e) {
          console.error('Failed focus on first input of union page', e)
        }
      })
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
