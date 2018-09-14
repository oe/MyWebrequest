<template>
<component :is="$getTipTagName('help')"/>
</template>

<script>
import HelpEn from './en.md'
import HelpCn from './cn.md'
export default {
  components: {
    HelpEn,
    HelpCn
  }
}
</script>