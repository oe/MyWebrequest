// Generated by CoffeeScript 1.9.2

/**
 *  配置underscore模板的默认分隔符
 */
var baseUrl;

baseUrl = location.href.replace(/\b\w+\.html(#.*)?$/, '');

seajs.config({
  base: baseUrl,
  paths: {
    'common': baseUrl.replace(/options\/$/, 'common')
  }
});

seajs.use('js/main');


//# sourceMappingURL=app.js.map
