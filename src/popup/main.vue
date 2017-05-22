<template>
<div class="popup">
  <div class="title-wrapper">
    {{ $t('prmpt_title') }}
    <span class="action-tip">{{ $t('action_tip') }}</span>
  </div>
  <div class="code-wrapper">
    <div class="text-container" v-show="isEdit">
      <div class="textarea">
        <textarea v-model="text" @keydown="onEnter" ref="textarea"></textarea>
        <div class="text-footer">
          <span class="error-tip" :hidden="!isToolong">{{ $t('text_toolong') }}</span>
          <div class="letter-counter">{{text.trim().length}}/{{ maxLength }}</div>
        </div>
      </div>
    </div>
    <div class="qrcode" v-show="!isEdit" @dblclick="onEdit">
      <img ref="qr">
    </div>
  </div>
</div>
</template>

<script>
import qrcode from '@/common/qrcode'
import locales from './lang.json'

export default {
  name: 'main',
  locales,
  data () {
    return {
      text: '',
      isEdit: false,
      isToolong: false,
      maxLength: qrcode.MAX_TEXT_LENGTH
    }
  },
  mounted() {
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, (tabs) => {
      const content = tabs[0].url
      this.text = content
      this.getCode(content)
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
      if ( !this.isToolong && (e.metaKey || e.ctrlKey ) && e.keyCode === 13 ) {
        const t = this.text.trim()
        console.log('e', e, t)
        if (t.length) {
          e.preventDefault()
          this.getCode(t)
        }
      }
    },
    getCode(text) {
      this.isEdit = false
      qrcode.makeQRCode(text, (err, url) => {
        if (err) {
          console.log('err', err)
        } else {
          this.$refs.qr.src = url
        }
      })
    }
  },
  watch: {
    text (val) {
      if (val.trim().length > this.maxLength) {
        this.isToolong = true
      } else {
        this.isToolong = false
      }
    }
  }
};
</script>

<style lang="scss">
@import '~@/common/common';

$qr-size: 250px;

body {
  min-width: 260px;
  min-height: 260px;
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

.code-wrapper {
  margin: 4px;
}

.text-container {
  @include size(240px);
  margin: 8px auto;
  position: relative;

  .textarea {
    position: relative;
    width: 100%;
    height: 210px;
    border:1px solid #66afe9;
    outline: 0;
    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(102, 175, 233, 0.6);
    border-radius: 4px;

    .text-footer {
      position: absolute;
      height: 20px;
      left: 4px;
      right: 4px;
      bottom: 0;
      font-size: 12px;

      .letter-counter {
        position: absolute;
        right: 0;
        bottom: 0;
      }

      .error-tip {
        color: red;
      }
    }
  }

  textarea {
    position: absolute;
    width: 100%;
    left: 0;
    top: 0;
    bottom: 20px;
    border: none;
    border-radius: 4px;
    padding: 8px;
    resize: none;
    font-size: 14px;

    &:focus {
      outline: none;
    }
  }
}
.qrcode {
  position: relative;
  @include size($qr-size);
  margin: 0 auto;

  img { width: 100%; height: 100%; }
}


</style>
