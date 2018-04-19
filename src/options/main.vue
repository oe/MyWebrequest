<template>
<div class="container">
  <sidebar></sidebar>
  <transition name="slide">
    <router-view class="page"></router-view>
  </transition>
</div>
</template>

<script>
import { mapActions } from 'vuex'
import sidebar from './components/sidebar'

export default {
  components: {
    sidebar
  },
  created () {
    this.changeRoute(this.$route)
  },
  methods: {
    ...mapActions(['changeModule']),
    changeRoute (router) {
      this.changeModule({
        module: router.path.replace('/', '')
      })
    }
  },
  watch: {
    $route (val) {
      this.changeRoute(val)
    }
  }
}
</script>

<style lang="scss">
@import '~@/common/base';
.page {
  position: absolute;
  width: $page-wdith;
  left: $sidebar-width + 8px;
  top: 0;
  padding-top: 70px;
  // transition: transform 300ms, opacity 250ms;
}

.setting-title {
  padding-top: $settings-title-padding;
  padding-bottom: 4px;
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

  > small {
    font-size: .8em;
    color: #999;
  }

  .setting-title + & {
    margin-top: 0;
  }
}

.slide-enter-active, .slide-leave-active {
  transition: transform 300ms, opacity 250ms;
}
.slide-enter, .slide-leave-to {
  transform: translateX(-200%);
  opacity: .8;
}


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
