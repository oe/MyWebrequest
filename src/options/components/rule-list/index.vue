<template>
<div>
  <div class="item-title">{{ $t('manageRule') }}
    <small >{{rules.length}} {{$t('ruleUnit')}}, {{activeCount}} {{$t('ruleUnit')}} {{$t('ruleIsActive')}}</small></div>
  <el-table
    :data="rules"
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
      label="Enabled"
      align="center"
      width="80">
      <template slot-scope="scope">
        <el-switch v-model="scope.row.enabled"></el-switch>
      </template>
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
      label="actions"
      align="center"
      width="120">
      <template slot-scope="scope">
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
import { mapState } from 'vuex'
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
  mounted () {
    window.tbl = this.$refs.tbl
  },
  methods: {
    onClickDeleteBtn () {
      if (!this.hasSelection) return
      this.removeSelectedRows()
    },
    onActiveChange () {
      this.save()
    },
    onClickItemDelete (scope) {
      this.data.splice(scope.$index, 1)
      this.save()
    },
    removeSelectedRows () {
      const selected = this.$refs.tbl.selection
      selected.forEach(itm => {
        // const idx = this.data.indexOf(itm)
        // this.data.splice(idx, 1)
      })
    },
    addRule: utils.debounce(function (rule) {
      const rl = JSON.parse(JSON.stringify(rule))
      rl.createdAt = rl.updatedAt = Date.now()

      // this.data.unshift(rl)
      this.save()
    }),
    save: utils.debounce(function (rule) {
      // collection.save(this.type, this.data)
    })
  },
  computed: {
    ...mapState({
      rules: state => state.rules.rules
    }),
    hasSelection () {
      return this.$refs.tbl.selection.length !== 0
    },
    activeCount () {
      return 0
      // return this.data.filter(itm => itm.active ).length
    }
  }
}
</script>

<style lang="scss">
.el-table td, .el-table th {
  padding: 10px 0;
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
