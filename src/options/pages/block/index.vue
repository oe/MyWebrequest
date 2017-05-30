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
      <el-button @click="onAddRule">Add rule</el-button>
    </el-form-item>
  </el-form>
  <div class="item-title">{{ $t('manageRule') }}</div>
  <el-table :data="rules" :show-header="false">
    <el-table-column label="Active" width="90" >
      <template scope="scope">
        <el-switch
          v-model="scope.row.active"
          on-color="#13ce66"
          off-color="#aaa">
        </el-switch>
      </template>
    </el-table-column>
    <el-table-column
      prop="rule"
      label="地址"
      show-overflow-tooltip>
    </el-table-column>
    <el-table-column width="80" label="action">
      <template scope="scope">
        <el-button type="text" size="mini" @click="onRemoveRule(scope.row)">delete</el-button>
      </template>
    </el-table-column>
  </el-table>
</div>
</template>

<script>
import utils from '@/options/components/utils'
import collection from '@/common/collection'
import locales from './locales.json'

export default {
  locales,
  data () {
    return {
      module: '',
      protocol: '',
      url: '',
      rules:  [{
        active: false,
        name: 'abc',
        rule: '2993934-3434-34',
        address: 'Beijing'
      }]
    }
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
      console.log('ahah')
    },
    onRemoveRule (item) {
      console.log(item)
    },
    updateModule () {
      this.module = this.$route.path.slice(1).toLowerCase()
      this.rules = collection.getRules(this.module)
    },
    addRule (rule) {
      this.rules.push({
        rule,
        active: true
      })
      collection.save(this.module, this.rules)
    }

  },
  watch: {
    $route () {
      this.updateModule()
    }
  }
};
</script>

<style lang="scss">
@import '~@/common/base';
</style>
