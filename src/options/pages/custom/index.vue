<template>
<div>
  <div class="setting-title">
    {{ $t('catTitle') }} <small>{{ $t('catSubTitle') }}</small>
  </div>
  <div class="item-title">{{ $t('addRuleTitle') }}</div>
  <div class="form-field">
    <el-input placeholder="请输入内容" v-model="host">
      <el-select v-model="protocol" slot="prepend" placeholder="请选择">
        <el-option label="餐厅名" value="1"></el-option>
        <el-option label="订单号" value="2"></el-option>
        <el-option label="用户电话" value="3"></el-option>
      </el-select>
      <el-button slot="append" icon="search"></el-button>
    </el-input>
  </div>
</div>
</template>

<script>
import locales from './locales.json'

export default {
  name: 'custom',
  locales,
  data () {
    return {
      host: '',
      protocol: '',
    }
  }
}
</script>

<style lang="scss">
@import '~@/common/base';

.setting-title {
  padding-top: $settings-title-padding;
  padding-bottom: 8px;
  font-size: 22px;
  @include border-bottom;
  margin-bottom: 10px;
  position: fixed;
  top: 0;
  width: $page-wdith;
  background-color: rgba(255, 255, 255, .8);
  z-index: 220;

  small {
    font-size: .8em;
    color: $sub-font-color;
  }
}

.item-title {
  padding-top: 4px;
  padding-bottom: 4px;
  font-size: 18px;
  margin-bottom: 10px;
  @include border-bottom;
}

.form-field {
  position: relative;
  margin-bottom: 6px;
}
</style>
