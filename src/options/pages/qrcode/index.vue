<template>
<div>
  <titlebar></titlebar>
  <el-row>
    <el-col :span="16">
      <el-tabs tab-position="left" class="qrcode-tabs" @tab-click="onTabClick">
        <el-tab-pane :label="$t('typeText')" ref="firstTab">
          <el-form size="small" :model="text">
            <el-form-item>
              <el-input type="textarea" autofocus resize="none" :rows="12" v-model="text.content" :placeholder="$t('textPlhd')"></el-input>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane :label="$t('typeVcard')">
          <el-form size="small" label-position="right" :label-width="labelWidth" :model="vcard">
            <el-form-item :label="$t('vcardName')">
              <el-input :placeholder="$t('vcardNamePlhd')" v-model="vcard.N"></el-input>
            </el-form-item>
            <el-form-item :label="$t('vcardTel')">
              <el-input :placeholder="$t('vcardTelPlhd')" v-model="vcard.TEL"></el-input>
            </el-form-item>
            <el-form-item :label="$t('vcardEmail')">
              <el-input :placeholder="$t('vcardEmailPlhd')" v-model="vcard.EMAIL"></el-input>
            </el-form-item>
            <el-form-item :label="$t('vcardURL')">
              <el-input :placeholder="$t('vcardURLPlhd')" v-model="vcard.URL"></el-input>
            </el-form-item>
            <el-form-item :label="$t('vcardAddr')">
              <el-input :placeholder="$t('vcardURLPlhd')" v-model="vcard.ADR"></el-input>
            </el-form-item>
            <el-form-item :label="$t('vcardMeno')">
              <el-input :placeholder="$t('vcardMenoPlhd')" type="textarea" resize="none" :rows="2" v-model="vcard.NOTE"></el-input>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane :label="$t('typeMsg')">
          <el-form size="small" label-position="right" :label-width="labelWidth" :model="msg">
            <el-form-item :label="$t('msgTo')">
              <el-input :placeholder="$t('vcardTelPlhd')" v-model="msg.tel"></el-input>
            </el-form-item>
            <el-form-item :label="$t('msgContent')">
              <el-input :placeholder="$t('msgContentPlhd')" type="textarea" resize="none" :rows="9" v-model="msg.content"></el-input>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-col>
    <el-col :span="8">
      <div class="qrcode-wrapper">
        <img ref="qr" class="qrcode-img">
        <div class="qrcode-error" v-if="qrError">
          {{$t(qrError, [errorMsg])}}
        </div>
      </div>
    </el-col>
  </el-row>
</div>
</template>

<script>
import qrcode from '@/common/qrcode'
import utils from '@/options/components/utils'
import locales from './locales.json'

export default {
  locales,
  data () {
    return {
      labelWidth: '90px',
      qrError: '',
      errorMsg: '',
      text: {
        content: ''
      },
      vcard: {
        N: '',
        TEL: '',
        EMAIL: '',
        URL: '',
        ADR: '',
        NOTE: ''
      },
      msg: {
        tel: '',
        content: ''
      }
    }
  },
  mounted () {
    this.updateQRCode('https://app.evecalm.com/')
    this.$nextTick(() => {
      this.focusTabsFirstInput(this.$refs.firstTab)
    })
  },
  methods: {
    onTabClick (tab) {
      this.$nextTick(() => {
        this.focusTabsFirstInput(tab)
      })
    },
    focusTabsFirstInput (tab) {
      try {
        // tab -> form -> form-item -> input -> focus()
        tab.$children[0].$children[0].$children[0].focus()
      } catch (e) {
        console.warn('Failed to focus the first input', e)
      }
    },
    async updateQRCode (text) {
      this.qrError = ''
      try {
        this.$refs.qr.src = await qrcode.makeQRCode(text)
      } catch (e) {
        this.qrError = 'genQrFailed'
        this.errorMsg = e.message
        console.warn('Failed to generate QRcode', e)
      }
    },
    validate (obj) {
      const content = Object.keys(obj).map((key) => obj[key]).join('').trim()
      if (!content) {
        this.qrError = 'noTextContent'
        return false
      }
      return true
    },
    getTextQR: utils.debounce(function () {
      if (!this.validate(this.text)) return
      this.updateQRCode(this.text.content.trim())
    }),
    getVcardQR: utils.debounce(function () {
      const vcard = this.vcard
      if (!this.validate(this.vcard)) return
      const content = Object.keys(vcard).map((key) => `${key}:${vcard[key]}`).join(';')
      this.updateQRCode(content)
    }),
    getMsgQR: utils.debounce(function () {
      if (!this.validate(this.msg)) return
      const content = `smsto:${this.msg.tel.trim()}:${this.msg.content.trim()}`
      this.updateQRCode(content)
    })
  },
  watch: {
    text: {
      handler () {
        this.getTextQR()
      },
      deep: true
    },
    vcard: {
      handler () {
        this.getVcardQR()
      },
      deep: true
    },
    msg: {
      handler () {
        this.getMsgQR()
      },
      deep: true
    }
  }
}
</script>

<style lang="scss">
@import '~@/common/base';
.qrcode-tabs {
  height: 240px;

  .el-form-item--small.el-form-item {
    margin-bottom: 4px;
  }
}
.qrcode-wrapper {
  width: 220px;
  height: 220px;
  text-align: center;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .qrcode-img {
    width: 200px;
    height: 200px;
  }

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
