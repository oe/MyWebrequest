<template>
<div class="container">
  <sidebar :current="router"></sidebar>
  <transition name="fade" mode="out-in" appear>
    <component :is="router" class="page"></component>
  </transition>
</div>
</template>

<script>
import qrcode from '@/common/qrcode'
import locales from './locales.json'
import sidebar from './components/sidebar'
import sidebarItems from './components/sidebar-items'

import custom from './pages/custom'

export default {
  name: 'main',
  locales,
  data () {
    return {
      router: ''
    }
  },
  beforeMount() {
    const hash = location.hash.replace(/^#/, '').toLowerCase()
    let r = sidebarItems.indexOf(hash) === -1 ? sidebarItems[0] : hash
    this.updateRouter(r)
  },
  components: {
    sidebar,
    custom
  },
  methods: {
    updateRouter (r) {
      const hash = location.hash.replace(/^#/, '').toLowerCase()
      if (r !== hash) location.hash = r
      this.router = r
    }
  }
}
</script>

<style lang="scss">
@import '~@/common/base';

$qr-size: 250px;

html {
  min-width: 260px;
  min-height: 310px;
}

</style>
