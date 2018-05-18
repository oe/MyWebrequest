<template>
<div>
  <titlebar></titlebar>
  Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci, quia obcaecati eveniet, recusandae eligendi quas reiciendis, facilis asperiores perferendis corrupti ipsum. Officia magnam, vel fuga facere suscipit aliquid corporis fugit!
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
