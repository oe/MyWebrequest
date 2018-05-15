<template>
<el-form label-position="left">
  <el-form-item size="small" :label="$t('matchLbl')">
    <el-input
      v-model="url"
      @paste.native="onPaste"
      @keyup.native.enter="onAddRule"
      placeholder="choose protocol" >
      <el-select v-model="protocol" slot="prepend" placeholder="">
        <el-option label="*://" value="*"></el-option>
        <el-option label="http://" value="http"></el-option>
        <el-option label="https://" value="https"></el-option>
      </el-select>
    </el-input>
  </el-form-item>
  
  <el-form-item size="small" label="Redirect url to">
    <el-input
      v-model="redirectUrl"
      placeholder="choose protocol" >
    </el-input>
  </el-form-item>

  <el-form-item size="small" label="Test your rule">
    <el-input
      v-model="testUrl"
      placeholder="choose protocol" >
      <el-button slot="append" @click="onAddRule">{{$t('addRuleTitle')}}</el-button>
    </el-input>
  </el-form-item>
</el-form>
</template>

<script>
import mixin, { mergeLang } from '../common-mixin'
import locales from './locales.json'
const lang = mergeLang(locales)

export default {
  name: 'custom',
  locales: lang,
  mixins: [mixin],
  data () {
    return {
      url: '',
      protocol: '*',
      redirectUrl: '',
      testUrl: ''
    }
  }
}
</script>

<style lang="scss">
</style>