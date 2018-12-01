<template>
  <div class="setting-title">
    {{ $t(module) }}
    <small v-html="$t(module+'Desc')"></small>
    <slot></slot>
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  computed: {
    ...mapState({
      module: state => state.rule.module
    })
  }
}
</script>