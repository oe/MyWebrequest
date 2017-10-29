<template>
<div class="rule-form-custom">
  <div class="form-field">
    <label>{{$t('matchLbl')}}</label>
    <el-input
      v-model="url"
      size="small"
      @paste.native="onPaste"
      @keyup.native.enter="onAddRule"
      placeholder="choose protocol" >
      <el-select v-model="protocol" slot="prepend" placeholder="">
        <el-option label="*://" value="*"></el-option>
        <el-option label="http://" value="http"></el-option>
        <el-option label="https://" value="https"></el-option>
      </el-select>
      <el-button slot="append" @click="onAddRule">{{$t('addRuleTitle')}}</el-button>
    </el-input>
  </div>
  
  <div class="form-field">
    <label>Redirect url to</label>
    <el-input
      size="small"
      v-model="redirectUrl"
      placeholder="choose protocol" >
    </el-input>
  </div>

  <div class="form-field">
    <label>Test your rule</label>
    <el-input
      size="small"
      v-model="testUrl"
      placeholder="choose protocol" >
    </el-input>
  </div>
</div>
</template>

<script>
import mixin, { mergeLang } from '../common-mixin'
import locales from './locales.json'
const lang = mergeLang(locales)

export default {
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