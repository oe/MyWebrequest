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
    -1 isnt protocols.indexOf protocol

  # // http://www.baidu.com/:g-:d/abc
  optionalParam = /\((.*?)\)/g
  namedParam    = /(\(\?)?:\w+/g
  splatParam    = /\*\w+/g
  escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g

  ###*
   * convert a url pattern to a regexp
   * @param  {[type]} route [description]
   * @return {[type]}       [description]
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
    matchs = /^(\w+):\/\/([^\/]+)\/?/.exec url
    # keep protocol
    res.p = matchs[1]
    # keep host
    res.h = matchs[2]
    # main domain
    res.m = res.h.split('.').slice(-2).join '.'
    res

  # return undefined if valid or a error message
  isRegValid = (reg)->
    try
      new RegExp reg
    catch e
      return e.message

  # get a list from redirect to url, eg. http://{sub}.github.com/{%name}/{=protol}
  # %name mean encodeURIComponent name
  # =name mean decodeURIComponent name
  getRedirectParamList = (url)->
    url.match(/\{([%=\w]+)\}/g).map (p)->
      p.trim().slice 1, -1

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
      unless -1 is ['%', '='].indexOf v.charAt 0
        v = v.slice 1
      res.push v if -1 is refer.indexOf v
    if res.length
      res
    else

  # have reserved word in url pattern
  # return a reserved words list that has been miss used.
  hasReservedWord = (params)->
    reserved = ['p', 'h', 'm']
    res = []
    for v in reserved
      unless -1 is params.indexOf(v) and -1 is params.indexOf("%#{v}") and -1 is params.indexOf("=#{v}")
        res.push v
    res = res.filter (v, k)->
      k is res.indexOf v
    reteurn res if res.length

  # fill a pattern with data
  fillPattern = (pattern, data)->
    pattern.replace /\{([%=\w]+)\}/g, ($0, $1)->
      # no prefix
      if -1 is ['%', '='].indexOf $1.charAt 0
        data[ $1 ] ? ''
      else
        prefix = $1.charAt 0
        v = data[ $1.slice(1) ] ? ''
        try
          if prefix is '%'
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

  # get the switch of cat whether has turned on
  getSwitch = (cat)->
    onoff = JSON.parse localStorage.getItem('onoff') or '{}'
    !!onoff[ cat ]

  # set switch of cat to isOn
  setSwitch = (cat, isOn)->
    onoff = JSON.parse localStorage.getItem('onoff') or '{}'
    onoff[ cat ] = !!isOn
    localStorage.setItem 'onoff', JSON.stringify onoff
    return

  getConfig = (key)->
    config = JSON.parse localStorage.getItem('config') or '{}'
    config[ key ]

  setConfig = (key, val)->
    config = JSON.parse localStorage.getItem('config') or '{}'
    config[ key ] = val
    localStorage.setItem 'config', JSON.stringify config
    return

  # get data from localStorage
  getLocal = (key, expectFormat)->
    switch expectFormat
      when 'object', 'o'
        JSON.parse localStorage.getItem( key ) or '{}'
      when 'array', 'a'
        JSON.parse localStorage.getItem( key ) or '[]'
      else
        localStorage.getItem key

  setLocal = (key, val)->
    if val?
      localStorage.setItem key, JSON.stringify val
    else
      localStorage.removeItem key
    return

  # i18n
  i18n = (msgid)->
    chrome.i18n.getMessage msgid

  return {
    getLocal         : getLocal
    setLocal         : setLocal
    getSwitch        : getSwitch
    setSwitch        : setSwitch
    getConfig        : getConfig
    setConfig        : setConfig
    isIp             : isIp
    isHost           : isHost
    isPath           : isPath
    isProtocol       : isProtocol
    i18n             : i18n
    route2reg        : route2reg
    getUrlParam      : getUrlParam
    isRegValid       : isRegValid
    hasUndefinedWord : hasUndefinedWord
    hasReservedWord  : hasReservedWord
    getTargetUrl     : getTargetUrl
  }
)