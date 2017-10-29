// import VueI18n from 'vue-i18n'
import utils from '@/options/components/utils'
import locales from './locales.json'

export function mergeLang (lang = {}) {
  const result = {}
  let keys = Object.keys(lang).concat(Object.keys(locales))
  keys = keys.filter((k, i) => keys.indexOf(k) === i)

  keys.forEach(k => {
    result[ k ] = Object.assign(lang[k] || {}, locales[k] || {})
  })
  return result
}

export default {
  methods: {
    onPaste (e) {
      const uri = utils.getUrlFromClipboard(e)
      if (!utils.isProtocol(uri.protocol)) return
      this.protocol = uri.protocol
      this.url = uri.raw.replace(`${uri.protocol}://`, '')
      e.preventDefault()
    },
    onAddRule () {

    }
  }
}
