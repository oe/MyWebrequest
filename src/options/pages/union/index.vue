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
  <rule-list ref="list"></rule-list>
  <el-dialog title="Edit this rule" :visible.sync="showEditDialog" @close="onDlgClose">
    <component ref="dlgForm" :is="formType" :ruleID="ruleID"></component>
    <div slot="footer" class="dialog-footer">
      <el-button size="small" @click="showEditDialog=false">Cancel</el-button>
      <el-button size="small" type="primary" @click="showEditDialog=false">Update</el-button>
      <el-button size="small" type="primary" @click="showEditDialog=false">Save as a new Rule</el-button>
      </div>
  </el-dialog>
</div>
</template>

<script>
import RuleList from '@/options/components/rule-list'
import collection from '@/common/collection'
import utils from '@/options/components/utils'
import CustomForm from '@/options/components/add-rule/custom'
import NormalForm from '@/options/components/add-rule/normal'
import { mapState, mapGetters } from 'vuex'
import locales from './locales.json'
export default {
  locales,
  data () {
    return {
      ruleID: '',
      showEditDialog: false,
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
    // restore router
    onDlgClose () {
      this.$router.replace({path: '/' + this.module})
    },
    onFeatureSatusChange () {
      const onoff = collection.get('onoff')
      onoff[this.module] = this.isEnabled
      collection.save('onoff', onoff)
    },
    updateModule () {
      const routerParams = {
        method: this.$route.params[0],
        query: this.$route.query
      }
      this.isEnabled = !!collection.get('onoff')[this.module]
      if (routerParams.method === 'edit' && routerParams.query.id) {
        this.showEditDialog = true
        this.ruleID = routerParams.query.id
        this.focusFormFirstInput('dlgForm')
      } else {
        this.focusFormFirstInput('form')
      }
    },
    focusFormFirstInput (formName) {
      setTimeout(() => {
        try {
          this.$refs[formName].$refs.firstInput.focus()
        } catch (e) {
          console.error('Failed focus on first input of union page', e)
        }
      }, 200)
    }
  },
  watch: {
    disabled (val) {
      this.isEnabled = false
    },
    $route (val, oldVal) {
      this.updateModule()
      // if module if the same
      if (utils.getModuleName(val.path) === utils.getModuleName(oldVal.path)) return
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
