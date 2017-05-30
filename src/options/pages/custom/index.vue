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
      v-model="redirectUrl"
      placeholder="choose protocol" >
    </el-input>
  </div>

  <div class="form-field">
    <label>Test your rule</label>
    <el-input
      v-model="testUrl"
      placeholder="choose protocol" >
    </el-input>
  </div>


  <div class="item-title">{{ $t('manageRule') }}</div>
  <el-table
    :data="tableData3"
    stripe
    border
    tooltip-effect="dark">
    <el-table-column
      type="selection"
      width="55">
    </el-table-column>
    <el-table-column
      label="日期"
      width="120">
      <template scope="scope">{{ scope.row.date }}</template>
    </el-table-column>
    <el-table-column
      prop="name"
      label="姓名"
      width="120">
    </el-table-column>
    <el-table-column
      prop="address"
      label="地址"
      show-overflow-tooltip>
    </el-table-column>
  </el-table>
</div>
</template>

<script>
import utils from '@/options/components/utils'
import locales from './locales.json'

export default {
  name: 'custom',
  locales,
  data () {
    return {
      url: '',
      protocol: '',
      redirectUrl: '',
      testUrl: '',
      tableData3: [{
        name: 'abc',
        date: '2993934-3434-34',
        address: 'Beijing'
      }]
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
    }
  }
}
</script>

<style lang="scss">
@import '~@/common/base';
</style>
