<template>
<div>
  <div class="setting-title">
    {{ $t('catTitle') }} <small>{{ $t('catSubTitle') }}</small>
  </div>
  <div class="item-title">{{ $t('addRuleTitle') }}</div>
  <div class="form-field">
    <label>Math this url</label>
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
      <el-button slot="append" @click="onAddRule">Add rule</el-button>
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
  <rule-list type="custom" ref="list"></rule-list>
</div>
</template>

<script>
import utils from '@/options/components/utils'
import RuleList from '@/options/components/rule-list'
import locales from './locales.json'

export default {
  name: 'custom',
  locales,
  components: {
    RuleList,
  },
  data () {
    return {
      url: '',
      protocol: '',
      redirectUrl: '',
      testUrl: ''
    }
  },
  methods: {
    onPaste (e) {
      const uri = utils.getUrlFromClipboard(e)
      if (!utils.isProtocol(uri.protocol)) return
      this.protocol = uri.protocol
      this.url = uri.raw.replace(`${uri.protocol}://`, '')
      e.preventDefault()
    },
    // add rule
    onAddRule () {
      console.log('add rule')
      this.$ref.list.updateTableData()
    }
  }
}
</script>

<style lang="scss">
@import '~@/common/base';
</style>
