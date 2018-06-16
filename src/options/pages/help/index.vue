<template>
<div>
  <titlebar></titlebar>
  <EnHelp class="lang-en"></EnHelp>
  Lorem ipsum dolor sit amet, consectetur adipisicing elit. Adipisci, quia obcaecati eveniet, recusandae eligendi quas reiciendis, facilis asperiores perferendis corrupti ipsum. Officia magnam, vel fuga facere suscipit aliquid corporis fugit!
</div>
</template>
<i18n src='./locales.json'></i18n>
<script>
import { mapState } from 'vuex'
import EnHelp from './help-en.md'
export default {
  data () {
    return {

    }
  },
  components: {
    EnHelp
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
figure {display: inline-block;}
.donate {
  display: flex;
  text-align: center;
}
.donate-item {
  display: flex;
  align-items: center;
}
.wechat-qr {
  width: 150px;
}
</style>
