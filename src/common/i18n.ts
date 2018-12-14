// get lang
const lang = chrome.i18n.getUILanguage().toLowerCase()
export default {
  lang: lang === 'zh-cn' ? 'zh-cn' : 'en',
  internationalize (str: string) {
    return str.replace(/__MSG_([^_]+)__/g, function (m, key) {
      return chrome.i18n.getMessage(key)
    })
  },
  i18nHTML () {
    document.documentElement.innerHTML = this.internationalize(document.documentElement.innerHTML)
  }
}
