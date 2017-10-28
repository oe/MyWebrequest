<template>
<div>
  <div class="item-title">{{ $t('manageRule') }}
    <small >{{data.length}} {{$t('ruleUnit')}}, {{activeCount}} {{$t('ruleUnit')}} {{$t('ruleIsActive')}}</small></div>
  <el-table
    :data="data"
    stripe
    ref="tbl"
    :empty-text="$t('noRules')"
    current-row-key="url"
    tooltip-effect="dark">
    <el-table-column
      type="selection"
      align="center"
      width="40">
    </el-table-column>
    <el-table-column
      label="Rule"
      cell-class-name="rule-cell"
      show-overflow-tooltip>
      <template slot-scope="scope">
        <div v-if="type === 'custom'" class="cs-cell">
          <div>{{scope.row.matchUrl}}</div>
          <div>{{scope.row.redirectUrl}}</div>
        </div>
        <template v-else>{{ scope.row.url}}</template>
      </template>
    </el-table-column>
    <el-table-column 
      label-class-name="tbl-del-th"
      :render-header="addDeleteBtn"
      align="center"
      width="120">
      <template slot-scope="scope">
        <el-switch
          v-model="scope.row.active"
          @change="onActiveChange"
          >
        </el-switch>
        <el-button
          plain
          size="mini"
          @click="onClickItemDelete(scope)"
          type="text">delete</el-button>
      </template>
    </el-table-column>
  </el-table>
</div>
</template>

<script>
import utils from '@/options/components/utils'
import collection from '@/common/collection.js'
import locales from './locales.json'

export default {
  locales,
  props: {
    type: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      data: []
    }
  },
  created () {
    this.updateTableData()
  },
  mounted () {
    window.tbl = this.$refs.tbl
  },
  methods: {
    updateTableData () {
      this.data = collection.getRules(this.type)
    },
    addDeleteBtn (h, scope) {
      return (
        <el-tooltip
          disabled={this.hasSelection}
          content="please check at least one row"
          placement="bottom"
          effect="light">
          <el-button
            size="small"
            onClick={this.onClickDeleteBtn}>Delete</el-button>
        </el-tooltip>
      )
    },
    onClickDeleteBtn () {
      if (!this.hasSelection) return
      this.removeSelectedRows()
    },
    onActiveChange () {
      this.save()
    },
    onClickItemDelete(scope) {
      this.data.splice(scope.$index, 1)
      this.save()
    },
    removeSelectedRows () {
      const selected = this.$refs.tbl.selection
      selected.forEach( itm => {
        const idx = this.data.indexOf(itm)
        this.data.splice(idx, 1)
      })
    },
    addRule: utils.debounce(function (rule) {
      const rl = JSON.parse(JSON.stringify(rule))
      this.data.unshift(rl)
      this.save()
    }),
    save: utils.debounce(function (rule) {
      collection.save(this.type, this.data)
    })
  },
  computed: {
    hasSelection () {
      return this.$refs.tbl.selection.length !== 0
    },
    activeCount () {
      return this.data.filter(itm => itm.active ).length
    }
  },
  watch: {
    type (val, oldVal) {
      this.updateTableData()
    }
  }
}
</script>

<style lang="scss">
.el-table td, .el-table th {
  padding: 10px 0;
}

.tbl-del-th button {
  &:focus {
    background-color: inherit;
    color: inherit;
    border-color: inherit;
  }
}
.rule-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: monospace;
}

.cs-cell {
  position: relative;
  padding-left: 14px;
  &:before {
    content: '{';
    position: absolute;
    left: 0;
    top: .2em;
    font-size: 2em;
    color: lightgray;
    font-weight: 100;
  }

  div { line-height: 1.4; }
}
</style>
