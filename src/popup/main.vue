<template>
<div class="popup">
  <div class="title-wrapper">
    {{ $t(isEdit ? 'editPromp' : isCustomText ? 'getNew' : 'prompt') }}
    <span class="action-tip">{{ $t(isEdit ? 'editTip' : 'actionTip') }}</span>
  </div>
  <div class="code-wrapper">
    <div class="text-container" v-show="isEdit">
      <textarea v-model="text" @keydown="onEnter" ref="textarea"></textarea>
      <div class="action-btn">
        <button type="button" @click="onMakeBtnClick">
          {{ $t(isMAC ? 'qrMakeMacBtn': 'qrMakeBtn')}}
        </button>
        <a href="/options/index.html#qrcode" target="_blank">{{ $t('moreLink') }}</a>
      </div>
    </div>
    <qr-img v-show="!isEdit" :text="text" :size="240" @dblclick.native="onEdit"></qr-img>
  </div>
</div>
</template>
<script>
import qrImg from '@/options/components/qr-img'
import locales from './locales.json'

export default {
  locales,
  data () {
    return {
      text: '',
      isEdit: false,
      isCustomText: false,
      isMAC: navigator.userAgent.indexOf('Macintosh') > -1
    }
  },
  components: {
    qrImg
  },
  created () {
    document.body.style.opacity = 0
    document.body.style.transition = 'opacity ease-out .3s'
    requestAnimationFrame(() => {
      document.body.style.opacity = 1
    })
  },
  mounted () {
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, (tabs) => {
      const content = tabs[0].url
      this.getCode(content, true)
    })
  },
  methods: {
    onEdit () {
      this.isEdit = true
      this.$nextTick(() => {
        this.$refs.textarea.focus()
      })
    },
    onEnter (e) {
      if ((e.metaKey || e.ctrlKey) && e.keyCode === 13) {
        const t = this.text.trim()
        console.log('e', e, t)
        if (t.length) {
          e.preventDefault()
          this.getCode(t)
          this.isCustomText = true
        }
      }
    },
    onMakeBtnClick () {
      this.getCode(this.text)
    },
    /**
     * get qrcode
     * @param  {String} text  qr text
     * @param  {Boolean} delay set true when use onload
     *                          with a delay to fixed the bug:
     *                          chrome resize popup page incorrectly
     * ref: https://bugs.chromium.org/p/chromium/issues/detail?id=428044
     */
    getCode (text, delay) {
      this.isEdit = false
      if (delay) {
        setTimeout(() => {
          this.text = text
        }, 50)
      } else {
        this.text = text
      }
    }
  }
}
</script>

<style lang="scss">
@import '~@/common/base';
$popup-width: 260px;
html, body {
  width: $popup-width;
  height: 312px;
  overflow: hidden;
}
.popup {
  width: $popup-width;
}
.title-wrapper {
  color: #555;
  padding: 4px;
  text-align: center;
  font-size: 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #eee;

  .action-tip {
    display: block;
    color: #999;
    font-size: 0.8em;
  }
}

.text-container {
  @include size(240px);
  margin: 8px auto 0;
  position: relative;

  textarea {
    width: 100%;
    height: 220px;
    border-radius: 4px;
    padding: 8px;
    resize: none;
    font-size: 14px;
    border-radius: 4px;
    @include hyphens;
    border:1px solid #dcdfe6;

    &:focus {
      border-color: #409eff;
      outline: none;
    }
  }

  .action-btn {
    text-align: center;
    font-size: 14px;
  }
  
  button {
    -webkit-appearance: none;
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #dcdfe6;
    outline: none;
    &:hover {
      color: #409eff;
      border-color: #c6e2ff;
      background-color: #ecf5ff;
    }

    &:active {
      color: #3a8ee6;
      border-color: #3a8ee6;
    }
  }
}
.qrcode-wrapper {
  width: $popup-width;
  height: $popup-width;
}
</style>
