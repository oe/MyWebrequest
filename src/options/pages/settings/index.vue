<template>
<div>
  <titlebar></titlebar>
  <div class="item-title">Extension icon style</div>
  <el-radio-group size="mini" v-model="iconStyle" class="icon-style-group">
    <div class="icon-colored">
      <el-radio label="colored" border >
        Colored</el-radio>      
    </div>
    <div class="icon-grey">
      <el-radio label="grey" border>
        </span>Grey</el-radio>      
    </div>
  </el-radio-group>
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
      iconStyle: 'colored'
    }
  },
  created () {
    window.sss = this
    this.iconStyle = collection.getConfig('iconStyle') || 'colored'
  },
  computed: {
    ...mapState({
      module: state => state.module
    })
  },
  methods: {
    onBackData () {
      const date = new Date()
      let fileName = 'MyWebrequest-' + date.toLocaleDateString() + '.json'
      this.save2File(collection.getExtensionData(), fileName)
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
      console.warn('val&olval', val, olval)
      collection.setConfig('iconStyle', val)
    }
  }
}
</script>

<style lang="scss">
@import '~@/common/base';
.icon-style-group {
  .el-radio {
    border-radius: 1em;
  }
  .icon-grey, .icon-colored {
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

    .el-radio {
      background-color: #fff;
      position: relative;
      top: 100%;
      transform: translateY(-50%);
    }
  }
  .icon-colored {
    background-image: url(/static/images/colored-icon-samp.png);
  }
  .icon-grey {
    background-image: url(/static/images/grey-icon-samp.png);
  }
}

.backup-restore {
  a {
    text-decoration: underline;
    cursor: pointer;
  }
}
</style>
