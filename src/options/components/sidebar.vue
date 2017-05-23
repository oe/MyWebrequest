<template>
<div class="sidebar">
  <div class="menu">
    <div class="menu-item" v-for="item in sidebarItems" :class="{active: current === item}">{{ $t(item)}}</div>
  </div>
</div>
</template>

<script>
import locales from './locales.json'
import sidebarItems from './sidebar-items'

export default {
  name: 'sidebar',
  locales,
  data () {
    return {
      sidebarItems
    }
  },
  props: {
    current: String
  }
};
</script>

<style lang="scss">
.sidebar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 230px;
}
</style>
