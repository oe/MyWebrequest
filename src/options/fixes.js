// prevent component Autocomplete from updating value on select
// https://github.com/ElemeFE/element/blob/5ad118b7eef2f9d1bd295edf93479c3f48377a71/packages/autocomplete/src/autocomplete.vue#L205
function fixAutocomplete (ac) {
  ac.methods.select = function (item) {
    // this.$emit('input', item[this.valueKey]);
    this.$emit('select', item, this.value)
    this.$nextTick(_ => {
      this.suggestions = []
      this.highlightedIndex = -1
    })
  }
}

export default {
  fixAutocomplete
}
