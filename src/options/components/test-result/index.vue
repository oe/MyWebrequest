<template>
<el-form-item size="small" label="Test Result" class="form-item-testresult">
  <div class="url-result">
    <template v-if="url">
      <a :href="url" target="_blank">{{url}}</a>
    </template>
    <template v-else>
      Please test your rule before add, you can add your rule after passed test
    </template>
  </div>
  <el-button v-if="showAddBtn" @click="onClick">{{$t('addRuleBtn')}}</el-button>
</el-form-item>
</template>

<script>
import locales from '../add-rule/locales.json'

export default {
  locales,
  props: {
    url: {
      type: String, // String, Number, Boolean, Function, Object, Array
      default: ''
    },
    showAddBtn: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    onClick (e) {
      this.$emit('add-click', e)
    }
  }
}
</script>

<style lang="scss">
.url-result {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
  word-break: break-all;
  padding: 0 4px;
  -webkit-line-clamp: 2;
  -webkit-box-pack: center;
  -webkit-box-orient: vertical;
}
</style>