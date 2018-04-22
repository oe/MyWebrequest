<template>
<div class="rule-form-normal">
  <el-popover
    ref="urlPopover"
    placement="bottom"
    title="标题"
    trigger="focus"
    content="这是一段内容,这是一段内容,这是一段内容,这是一段内容。">
  </el-popover>
  <el-form :model="rule" label-position="top" :rules="validateRules" ref="ruleForm">
    <el-form-item label="Math this url" :gutter="0">
      <el-col :span="10">
        <el-input
          size="small"
          v-model="rule.host"
          @paste.native="onPaste"
          @keyup.native.enter="onAddRule"
          v-popover:urlPopover
          placeholder="host, required, paste a url here" >
          <el-select v-model="rule.protocol" slot="prepend" placeholder="">
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
          v-model="rule.pathname"
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
      rule: {
        protocol: '*',
        host: '',
        pathname: ''
      }
    }
  },
  computed: {
    validateRules () {
      return {
        protocol: [
          {required: true, message: 'please choose protocol'}
        ],
        host: [
          {required: true, message: 'host is needed'}
        ]
      }
    }
  },
  methods: {
    async onAddRule () {
      const url = `${this.protocol}://${this.url}`
      const isOK = await this.$refs.ruleForm.validate()
      if (!isOK) return
      if (this.isRuleExist(url)) {
        this.$message({
          message: 'Same rule has already added',
          type: 'error'
        })
        return
      }
      this.addRule(url)
    }
  }
}
</script>

<style lang="scss">
.path-sep {
  text-align: center;
}
</style>