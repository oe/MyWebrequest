<template>
<div>
  <titlebar></titlebar>
  <el-tabs tab-position="left">
    <el-tab-pane>
      <span slot="label"><i class="el-icon-date"></i> 我的行程</span>
      我的行程
    </el-tab-pane>
    <el-tab-pane label="消息中心">消息中心</el-tab-pane>
    <el-tab-pane label="角色管理">角色管理</el-tab-pane>
    <el-tab-pane label="定时任务补偿">定时任务补偿</el-tab-pane>
  </el-tabs>
</div>
</template>
<i18n src='./locales.json'></i18n>
<script>
import { mapState } from 'vuex'
export default {
  data () {
    return {

    }
  },
  computed: {
    ...mapState({
      module: state => state.module
    })
  }

}
</script>

<style lang="scss">
@import '~@/common/base';
</style>
