<template>
<div class="sidebar">
  <div class="app-name">
    {{ $t('appName') }}
  </div>
  <ul class="menu">
    <router-link
      tag="li"
      class="menu-item"
      v-for="item in sidebarItems"
      :key="item"
      :to="'/' + item"
      >{{ $t(item)}}</router-link>
  </ul>
</div>
</template>

<script>
import locales from './locales.json'

export default {
  locales,
  data () {
    return {
      sidebarItems: [
        'custom',
        'block',
        'hsts',
        'hotlink',
        'log',
        'qrcode',
        'utility',
        'settings',
        'help'
      ]
    }
  }
}
</script>

<style lang="scss">
@import '~@/common/base';

.sidebar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: $sidebar-width;
  z-index: 100;
  background-color: #fff;

  .app-name {
    padding: $sidebar-padding 0 10px $sidebar-padding;
    font-size: 18px;
    color: $main-color;
  }

  .menu {
    list-style-type: none;
    color: $third-font-color;
    padding-left: 0;

    .menu-item {
      padding: 4px 0 4px $sidebar-padding;
      border-left: 6px solid white;
      cursor: pointer;

      &.router-link-active {
        border-left-color: $sub-font-color;
        color: $main-font-color;
        cursor: default;
        font-weight: bold;
      }
    }
  }
}
</style>
