<template>
<div>
  <div class="setting-title">
    {{ $t('catTitle') }} <small>{{ $t('catSubTitle') }}</small>
  </div>
  <div class="item-title">{{ $t('addRuleTitle') }}</div>
  <div class="form-field">
    <div class="input-field protocol">
      <label>Match this url</label>
      <select class="input">
        <option value="*">*</option>
        <option value="http">http</option>
        <option value="https">https</option>
      </select>
    </div>
    <div class="input-field">
      <label>&nbsp;</label>
      <div class="input">://</div>
    </div>
    <div class="input-field auto-width">
      <label>&nbsp;</label>
      <input type="text" class="input">
    </div>
  </div>
</div>
</template>

<script>
import locales from './locales.json'

export default {
  name: 'custom',
  locales,
  data () {
    return {

    }
  }
}
</script>

<style lang="scss">
@import '~@/common/base';

.setting-title {
  padding-top: $settings-title-padding;
  padding-bottom: 8px;
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
  @include border-bottom;
}

.form-field {
  position: relative;
  height: 55px;
  margin-right: 4px;
  display: flex;
  
  .input-field {
    display: block;
    margin-right: 4px;

    &.protocol {
      width: 70px;
    }

    &.full-width {
      width: 100%;
    }

    &.auto-width {
      flex: 1;
    }
    
    &.right-side {
      width: 100px;
    }

    label {
      display: block;
      white-space: nowrap;
      margin-bottom: 4px;
      visibility: visible;
    }

    .input {
      display: block;
      height: 28px;
      width: 100%;
      line-height: 28px;
    }
  }
}
</style>
