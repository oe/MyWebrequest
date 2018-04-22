<template>
<div class="rule-form-normal">
  <el-popover
    ref="urlPopover"
    placement="bottom"
    title="标题"
    trigger="focus"
    content="这是一段内容,这是一段内容,这是一段内容,这是一段内容。">
  </el-popover>
  <el-form label-position="top" ref="ruleForm">
    <el-form-item label="Math this url" :error="errorMsg">
      <el-col :span="10">
        <el-input
          size="small"
          v-model="host"
          @input="onFormChange"
          @paste.native="onPaste"
          @keyup.native.enter="onAddRule"
          v-popover:urlPopover
          placeholder="host, required, paste a url here" >
          <el-select v-model="protocol" slot="prepend">
            <el-option label="*://" value="*"></el-option>
            <el-option label="http://" value="http"></el-option>
            <el-option label="https://" value="https"></el-option>
          </el-select>
        </el-input>
      </el-col>
      <el-col :span="1" class="path-sep">/</el-col>
      <el-col :span="13">
        <el-input
          size="small"
          v-model="pathname"
          @input="onFormChange"
          @paste.native="onPaste"
          @keyup.native.enter="onAddRule"
          placeholder="pathname and querystring, optional" >
          <el-button slot="append" @click="onAddRule">Add rule</el-button>
        </el-input>
      </el-col>
    </el-form-item>
  </el-form>
</div>
</template>

<script>
import mixin from '../common-mixin'
export default {
  mixins: [mixin],
  data () {
    return {
      protocol: '*',
      host: '',
      pathname: '',
      // 错误信息
      errorMsg: '',
      etid: 0,
      isHiding: false
    }
  },
  computed: {
  },
  methods: {
    onAddRule () {
      const path = this.pathname || '*'
      const url = `${this.protocol}://${this.host}/${path}`
      if (this.isRuleExist(url)) {
        this.showInputError('Same rule has already added')
        return
      }
      this.addRule(url)
    },
    onFormChange () {
      this.hideInputError()
    },
    showInputError (msg) {
      clearTimeout(this.etid)
      this.isHiding = false
      this.errorMsg = msg
    },
    hideInputError () {
      if (this.isHiding || !this.errorMsg) return
      console.log('on change')
      this.isHiding = true
      this.etid = setTimeout(() => {
        this.errorMsg = ''
        this.isHiding = false
      }, 1000)
    }
  }
}
</script>

<style lang="scss">
.path-sep {
  text-align: center;
}
</style>