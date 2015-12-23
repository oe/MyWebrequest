###*
 *  配置underscore模板的默认分隔符
###
# _.templateSettings =
#   evaluate: /\{\{([\s\S]+?)\}\}/g
#   interpolate: /\{\{=([\s\S]+?)\}\}/g
#   escape: /\{\{-([\s\S]+?)\}\}/g

baseUrl = location.href.replace /\b\w+\.html(#.*)?$/, ''
seajs.config
  base: baseUrl
  paths:
    'common': baseUrl.replace /options\/$/, 'common'
  alias:
    'dialog': baseUrl + 'lib/artdialog/js/dialog-plus'

seajs.use 'js/main'