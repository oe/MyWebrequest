<template>
<div class="rule-form-normal">
  <el-popover
    ref="urlPopover"
    placement="bottom"
    title="标题"
    trigger="focus"
    content="这是一段内容,这是一段内容,这是一段内容,这是一段内容。">
  </el-popover>
  <div class="form-field">
    <label>Math this url</label>
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
      <el-button slot="append" @click="onAddRule">Add rule</el-button>
    </el-input>
  </div>
</div>
</template>

<script>
import mixin from '../common-mixin'
export default {
  mixins: [mixin],
  data () {
    return {
      module: '',
      protocol: '*',
      url: '',
      isEnabled: false,
      rules: []
    }
  }
}
</script>

<style lang="scss">
</style>