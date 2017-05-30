<template>
<div class="container">
  <sidebar :current="router"></sidebar>
  <transition name="fade" mode="out-in" appear>
    <router-view class="page"></router-view>
  </transition>
</div>
</template>

<script>
import qrcode from '@/common/qrcode'
import locales from './locales.json'
import sidebar from './components/sidebar'


export default {
  name: 'main',
  locales,
  data () {
    return {
      router: '',
      input5: '',
      select: ''
    }
  },
  components: {
    sidebar
  }
}
</script>

<style lang="scss">
@import '~@/common/base';
.page {
  width: $page-wdith;
  margin-left: $sidebar-width + 8px;
  padding-top: 80px;
}

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
  margin-top: 1em;
  @include border-bottom;

  .setting-title + & {
    margin-top: 0;
  }
}
// .el-form-item
// .el-form-item:after {
//   display: none;
// }

.el-form-item__content {
  &:before,
  &:after {
    display: none;
  }

  display: flex;
  justify-content: space-between;

  > .el-input {
    width: $big-input-wdith;
  }
}


.el-select .el-input {
  width: 80px;

  > .el-input__icon {
    width: 20px;
  }

  input {
    padding-right: 20px;
  }
}


</style>
