<template>
  <div>
    <div class="item-title">
      {{ $t('manageRule') }}
      <small>{{rules.length}} {{$t('ruleUnit')}}, {{activeCount}} {{$t('ruleUnit')}} {{$t('ruleIsActive')}}</small>
    </div>
    <el-table
      :data="rules"
      ref="tbl"
      :empty-text="$t('noRules')"
      row-key="id"
      tooltip-effect="dark"
    >
      <el-table-column type="selection" align="center" width="40"></el-table-column>
      <el-table-column :label="$t('enabled')" align="center" width="80">
        <template slot-scope="scope">
          <el-switch
            :disabled="!scope.row.valid"
            v-model="scope.row.enabled"
            @click.native.capture="onToggleRule($event, scope)"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column :label="$t('rule')" cell-class-name="rule-cell" show-overflow-tooltip>
        <template slot-scope="scope">
          <div v-if="module === 'custom'" class="cs-cell">
            <div>{{scope.row.matchUrl}}</div>
            <div>{{scope.row.redirectUrl}}</div>
          </div>
          <template v-else>{{ scope.row.url}}</template>
        </template>
      </el-table-column>
      <el-table-column :label="$t('actions')" align="center" width="120">
        <template slot-scope="scope">
          <el-button
            size="mini"
            @click="onEditItem(scope)"
            type="text"
          >{{$t(scope.row.valid ? 'edit' : 'fix')}}</el-button>

          <el-button size="mini" @click="onDeleteItem(scope)" type="text">{{$t('delete')}}</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'
import locales from './locales.json'

export default {
  locales,
  mounted () {
    window.tbl = this.$refs.tbl
  },
  methods: {
    ...mapActions(['toggleRule', 'removeRules']),
    onDeleteSelected () {
      if (!this.hasSelection) return
      const ids = this.$refs.tbl.selection.map(itm => itm.id)
      this.removeSelectedRows(ids)
    },
    onToggleRule (e, scope) {
      if (!scope.row.valid) return
      e.preventDefault()
      this.toggleRule(scope.row.id)
    },
    onDeleteItem (scope) {
      this.removeRules(scope.row.id)
    },
    onEditItem (scope) {
      this.$router.replace({
        path: `/${this.module}/edit`,
        query: { id: scope.row.id }
      })
    }
  },
  computed: {
    ...mapState({
      module: state => state.rule.module
    }),
    ...mapGetters({
      rules: 'sortedRules'
    }),
    hasSelection () {
      return this.$refs.tbl.selection.length !== 0
    },
    activeCount () {
      return this.rules.filter(itm => itm.enabled).length
    }
  },
  watch: {
    // rules (newVal, oldValue) {
    //   debugger
    // }
  }
}
</script>

<style lang="scss">
.el-table td,
.el-table th {
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
    content: "{";
    position: absolute;
    left: 0;
    top: 0.2em;
    font-size: 2em;
    color: lightgray;
    font-weight: 100;
  }

  div {
    line-height: 1.4;
  }
}
</style>
