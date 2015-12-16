((root, factory)->
  if typeof define is 'function' and (define.amd or define.cmd)
    define ->
      factory root
  else if typeof exports is 'object'
    module.exports = factory root
  else
    root.utils = factory root
  return
)(this, (root) ->

  # check an ip addr. eg. 102.33.22.1
  ipReg = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])$/
  isIp = (ip)->
    ipReg.test ip

  # check a host. eg. google.com, dev.fb.com, etc.
  hostReg = /^(\*((\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,4})?|([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,4})$/
  isHost = (host)->
    hostReg.test host

  # check a path. eg. path/subpath/file.html?querystring
  pathReg = /^[a-z0-9-_\+=&%@!\.,\*\?\|~\/]+$/i
  isPath = (path)->
    pathReg.test path

  protocols = [ '*', 'https', 'http']
  isProtocol = (protocol)->
    protocol in protocols


  # // http://www.baidu.com/:g-:d/abc
  optionalParam = /\((.*?)\)/g
  namedParam    = /(\(\?)?:\w+/g
  splatParam    = /\*\w+/g
  escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g

  ###*
   * convert a url pattern to a regexp
   * @param  {String} route url pattern
   * @return {Object}
   *                 {
   *                    reg: regexp string can match an url
   *                    params: var name of each named param
   *                 }
  ###
  route2reg = (route)->
    params = []
    route = route.replace escapeRegExp, '\\$&'
    .replace optionalParam, '(?:$1)?'
    .replace namedParam, (match, optional)->
      params.push match.replace /^[^:]*?:/, ''
      if optional then match else '([^/?]+)'
    .replace splatParam, (match)->
      params.push match.replace /^[^*]*?\*/, ''
      '([^?]*?)'
    reg = '^' + route + '(?:\\?([\\s\\S]*))?$'
    {
      reg: reg
      params: params
    }

  ###*
   * check the route
   * return undefined if valid
   * return false params is empty
   * return an array of duplicated names if found in params
   * @param  {Object}  res result returned by route2reg
   * @return {Boolean|Array|undefined}
  ###
  isRouteValid = (res)->
    params = res.params
    return false unless params.length
    res = params.filter (v, k)-> k isnt params.indexOf v
    if res.length
      res
    


  # reg to match protocol, host, path, query
  urlComponentReg = /^(\w+):\/\/([^/]+)\/([^?]+)?(\?(.*))?$/
  ###*
   * get a key-value object from the url which match the pattern
   * @param  {Object} r   {reg: ..., params: ''} from route2reg
   * @param  {String} url a real url that match that pattern
   * @return {Object}
  ###
  getUrlParam = (r, url)->
    res = {}
    try
      matchs = (new RegExp(r.reg)).exec url
    catch e
      matchs = ''

    return null unless matchs

    for v, k in r.params
      res[ v ] = matchs[ k + 1 ] or ''
    matchs = urlComponentReg.exec url
    # keep protocol
    res.p = RegExp.$1
    # keep host
    res.h = RegExp.$2
    # main domain
    res.m = res.h.split('.').slice(-2).join '.'
    # path
    res.r = RegExp.$3
    # query string without question mark
    res.q = RegExp.$5
    res

  # return undefined if valid or a error message
  isRegValid = (reg)->
    try
      new RegExp reg
      return
    catch e
      return e.message

  # get a list from redirect to url, eg. http://{sub}.github.com/{%name}/{=protol}
  # %name mean encodeURIComponent name
  # =name mean decodeURIComponent name
  getRedirectParamList = (url)->
    url.match(/\{([%=]?[\w]+)\}/g).map (v)-> v.slice 1, -1

  ###*
   * return undefined if no undefined word, or a list contains undefined words
   * @param  {Object}  refer a defined word list
   * @param  {String}  url   a url pattern that use words in refer
   * @return {Array|undefined}
  ###
  hasUndefinedWord = (refer, url)->
    res = []
    sample = getRedirectParamList url
    for v in sample
      if v.charAt(0) in ['%', '=']
        v = v.slice 1
      res.push v if v not in refer
    if res.length
      res

  # pre-defined placeholders
  RESERVED_HOLDERS = ['p', 'h', 'm', 'r', 'q']
  # have reserved word in url pattern
  # return a reserved words list that has been miss used.
  hasReservedWord = (params)->
    res = []
    for v in RESERVED_HOLDERS
      if v in params or "%#{v}" in params or "=#{v}" in params
        res.push v
    # remove duplicated names
    res = res.filter (v, k)->
      k isnt res.indexOf v
    return res if res.length

  # fill a pattern with data
  fillPattern = (pattern, data)->
    pattern.replace /\{([%=]?)([\w]+)\}/g, ($0, $1, $2)->
      # no prefix
      unless $1
        data[ $2 ] ? ''
      else
        v = data[ $2 ] ? ''
        try
          if $1 is '%'
            v = encodeURIComponent v
          else
            v = decodeURIComponent v
        catch e
        v

  ###*
   * get target url
   * @param  {String} route   url pattern to match a url
   * @param  {String} pattern url pattern that to get a new url
   * @param  {String} url     a real url that match route
   * @return {String}         converted url
  ###
  getTargetUrl = (route, pattern, url)->
    r = route2reg route
    params = getUrlParam r, url
    return '' unless params
    fillPattern pattern, params


  ###*
   * get i18n text
   * @param  {String} msgid text label id
   * @return {String}
  ###
  i18n = (msgid)->
    chrome.i18n.getMessage msgid

  ###*
   * GET url info url the clipboard, returns {protocol, host, path}
   * @param  {Event} e  paste event
   * @return {Object}
  ###
  getUrlFromClipboard = (e)->
    result = {}
    url = e.originalEvent.clipboardData.getData 'text/plain'
    return result unless url

    i = url.indexOf '://'
    url = '*://' + url if i is -1

    return result unless url.match /^([a-z]+|\*):\/\/([^\/]+)(\/.*)?$/i
    # extract regexp results right now or things changed
    result.protocol = RegExp.$1.toLowerCase()
    result.host = RegExp.$2
    result.path = RegExp.$3
    result

  return {
    isIp                : isIp
    isHost              : isHost
    isPath              : isPath
    isProtocol          : isProtocol
    i18n                : i18n
    route2reg           : route2reg
    getUrlParam         : getUrlParam
    isRegValid          : isRegValid
    hasUndefinedWord    : hasUndefinedWord
    hasReservedWord     : hasReservedWord
    getTargetUrl        : getTargetUrl
    getUrlFromClipboard : getUrlFromClipboard
  }
)