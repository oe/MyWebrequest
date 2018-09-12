<template>
<div class="page-settings">
  <titlebar></titlebar>
  <div class="item-title">Extension icon style</div>
  <el-radio-group size="mini" v-model="iconStyle" @click.native="onIconStyleClick">
    <div class="icon-colored js-icon">
      <el-radio label="colored" border>
        Colored</el-radio>      
    </div>
    <div class="icon-grey js-icon">
      <el-radio label="grey" border>
        Grey</el-radio>      
    </div>
  </el-radio-group>
  <div class="item-title">Show QR Contextmenu</div>
  <div class="icon-qrmenu js-icon" @click="onIconStyleClick">
    <el-checkbox v-model="showQrMenu" border size="mini">
      Enable ContextMenu</el-checkbox>
  </div>
  <div class="item-title">Data Backup / Restore</div>
  <div class="backup-restore">
    <div class="actions">
      <a @click="onBackData">Backup</a>
      /
      <label>
        <input @change="onRestoreData" type="file" accept=".json" hidden>
        <a>Restore</a>
      </label>
    </div>
  </div>
  <div class="tips">When restoring, the config file should be in json format and file name with <strong>.json</strong> extension</div>
</div>
</template>
<i18n src='./locales.json'></i18n>
<script>
import collection from '@/common/collection'

import { mapState } from 'vuex'
export default {
  data () {
    return {
      iconStyle: 'colored',
      showQrMenu: false
    }
  },
  async created () {
    window.sss = this
    const config = await collection.get('config')
    this.iconStyle = config.iconStyle || 'colored'
    this.showQrMenu = config.showQrMenu || false
  },
  computed: {
    ...mapState({
      module: state => state.module
    })
  },
  methods: {
    onIconStyleClick (e) {
      const target = e.target
      if (!target.classList.contains('js-icon')) return
      target.children[0].click()
    },
    async onBackData () {
      const date = new Date()
      let fileName = 'MyWebrequest-' + date.toLocaleDateString() + '.json'
      const extData = await collection.getExtensionData()
      this.save2File(extData, fileName)
    },
    onRestoreData (e) {
      const files = e.target.files
      console.log('files', files[0])
      // if (!files.length) return
    },
    save2File (text, filename) {
      if (typeof text === 'object') {
        text = JSON.stringify(text, null, 2)
      } else {
        text = String(text)
      }
      text = encodeURIComponent(text)
      const dom = document.createElement('a')
      dom.setAttribute('href', 'data:text/plain;charset=utf-8,' + text)
      dom.setAttribute('download', filename)
      return dom.click()
    }
  },
  watch: {
    iconStyle (val, olval) {
      collection.setConfig('iconStyle', val)
    },
    showQrMenu (val) {
      collection.setConfig('showQrMenu', val)
    }
  }
}
</script>

<style lang="scss">
@import '~@/common/base';
.page-settings {
  .el-radio,
  .el-checkbox {
    border-radius: 1em !important;
    background-color: #fff;
    position: relative;
    top: 100%;
    transform: translateY(-50%);
  }

  // .el-checkbox {
  //   padding: 6px;
  //   height: auto;
  // }
  .icon-grey,
  .icon-colored,
  .icon-qrmenu {
    display: inline-block;
    position: relative;
    width: 150px;
    height: 100px;
    text-align: center;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-right: 20px;
    background-repeat: no-repeat;
    background-size: 100%;
  }
  .icon-colored {
    background-image: url(/static/images/colored-icon-samp.png);
  }
  .icon-grey {
    background-image: url(/static/images/grey-icon-samp.png);
  }
  .icon-qrmenu {
    width: 300px;
    height: 200px;
    background-image: url(/static/images/qr-menu.png);
  }
  .backup-restore {
    a {
      text-decoration: underline;
      cursor: pointer;
    }
  }
}
</style>
