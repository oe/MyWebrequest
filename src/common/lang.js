// get lang
const lang = chrome.i18n.getUILanguage().toLowerCase()
export default lang === 'zh-cn' ? 'zh-cn'  : 'en'

