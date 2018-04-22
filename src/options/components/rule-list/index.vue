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
        <el-switch
          v-model="scope.row.enabled"
          @click.native.capture="onToggleRule($event, scope)"></el-switch>
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
          size="mini"
          @click="onEditItem(scope)"
          type="text">edit</el-button>

        <el-button
          size="mini"
          @click="onDeleteItem(scope)"
          type="text">delete</el-button>

      </template>
    </el-table-column>
  </el-table>
</div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
// import utils from '@/options/components/utils'
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
    ...mapActions(['toggleRule', 'removeRules']),
    onDeleteSelected () {
      if (!this.hasSelection) return
      const urls = this.$refs.tbl.selection.map(itm => itm.url)
      this.removeSelectedRows(urls)
    },
    onToggleRule (e, scope) {
      e.preventDefault()
      this.toggleRule(scope.row.url)
    },
    onDeleteItem (scope) {
      this.removeRules(scope.row.url)
    },
    onEditItem (scope) {

    }
  },
  computed: {
    ...mapGetters({
      rules: 'sortedRules'
    }),
    hasSelection () {
      return this.$refs.tbl.selection.length !== 0
    },
    activeCount () {
      return this.rules.filter(itm => itm.enabled).length
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
