<template>
<div class="qrcode-wrapper">
  <img ref="qr" class="qrcode-img" :style="sizeStyle">
  <div class="qrcode-error" v-if="qrError">
    {{$t(qrError, [errorMsg])}}
  </div>
</div>
</template>

<script>
import locales from './locales.json'
import qrcode from '@/common/qrcode'

export default {
  locales,
  data () {
    return {
      errorMsg: '',
      qrError: ''
    }
  },
  props: {
    text: {
      type: String, // String, Number, Boolean, Function, Object, Array
      required: true,
      default: ''
    },
    size: {
      type: Number,
      default: 200
    }
  },
  computed: {
    sizeStyle () {
      return `width: ${this.size}px;height: ${this.size}px;`
    }
  },
  methods: {
    async updateQRCode (text) {
      text = text.trim()
      if (!text) {
        this.qrError = 'noTextContent'
        return false
      }
      this.qrError = ''
      try {
        this.$refs.qr.src = await qrcode.makeQRCode(text)
      } catch (e) {
        this.qrError = 'genQrFailed'
        this.errorMsg = e.message
        console.warn('Failed to generate QRcode', e)
      }
    }
  },
  watch: {
    text (val) {
      this.updateQRCode(val)
    }
  }
}
</script>

<style lang="scss">
.qrcode-wrapper {
  padding: 10px;
  text-align: center;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .qrcode-error {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    word-wrap: break-word;
    // word-break: break-all;
    background-color: rgba(253, 246, 236, .95);
    color: #6d4408;
    font-weight: 300;
  }
}

</style>