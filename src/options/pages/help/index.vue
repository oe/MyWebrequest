<template>
  <div>
    <titlebar></titlebar>
    <component :is="$getTipTagName('help')"/>
  </div>
</template>
<i18n src='./locales.json'></i18n>
<script>
import { mapState } from 'vuex'
import HelpEn from './help-en.md'
import HelpCn from './help-cn.md'
export default {
  data () {
    return {

    }
  },
  components: {
    HelpEn,
    HelpCn
  },
  computed: {
    ...mapState({
      module: state => state.rule.module
    })
  }
}
</script>

<style lang="scss">
@import "~@/common/base";
figure {
  display: inline-block;
}
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
