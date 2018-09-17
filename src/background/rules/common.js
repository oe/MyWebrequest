import clonedeep from 'lodash.clonedeep'
import collection from '@/common/collection'

export default {
  /**
   * remove headers with names
   * @param  {Array} headers headers
   * @param  {Array|String} names   names to remove
   * @return {Array}
   */
  removeHeaders (headers, names) {
    let isInNames
    if (Array.isArray(names)) {
      isInNames = name => names.includes(name)
    } else {
      isInNames = name => names === name
    }
    let len = headers.length
    while (len--) {
      if (isInNames(headers[len].name)) {
        headers.splice(len, 1)
      }
    }
  },

  // get rule object by rule type
  async getRule (type, defaultRules) {
    console.warn('get rule type', type)
    // clone Depp to avoid urls duplication
    const rule = clonedeep(defaultRules)
    if (!rule) {
      console.warn('cant find rules of', type)
      return
    }
    let urls = await collection.getData4Bg(type)
    rule.urls.push(...urls)
    console.warn(`all rules of ${type}`, rule.urls)
    // return rule of has urls
    return rule.urls.length && rule
  }
}
