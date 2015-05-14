###*
 *  配置underscore模板的默认分隔符
###
_.templateSettings =
  evaluate: /\{\{([\s\S]+?)\}\}/g
  interpolate: /\{\{=([\s\S]+?)\}\}/g
  escape: /\{\{-([\s\S]+?)\}\}/g

seajs.config
  base: location.href.replace /\b\w+\.html(#.*)?$/, ''

seajs.use 'js/main'