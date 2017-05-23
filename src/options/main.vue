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

import custom from './pages/custom'

export default {
  name: 'main',
  locales,
  data () {
    return {
      router: 'custom'
    }
  },
  components: {
    sidebar,
    custom
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
