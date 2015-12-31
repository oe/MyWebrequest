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

  protocols = [ '*', 'https', 'http']
  isProtocol = (protocol)->
    protocol in protocols

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

  # reg to match protocol, host, path, query
  urlComponentReg = /^(\*|\w+):\/\/([^/]+)(\/[^?]*)(\?(.*))?$/
  isUrl = (url)->
    matches = urlComponentReg.exec url
    return false unless matches
    return false unless isProtocol matches[1]
    return false unless isHost( matches[2] ) or isIp( matches[2] )
    path = matches[3] + matches[4]
    return false unless isPath path
    return true

  ###*
   * get i18n text
   * @param  {String} msgid text label id
   * @return {String}
  ###
  i18n = (msgid)->
    chrome.i18n.getMessage msgid

  ###*
   * get object's values into an array
   * @param  {Object} o
   * @return {Array}
  ###
  getObjVals = (o)->
    res = []
    for own k, v of o
      res.push v
    res

  # return undefined if valid or a error message
  isRegValid = (reg)->
    try
      new RegExp reg
      return
    catch e
      return e.message

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

  ###*
   * is rule coverring subRule
   * like: *://*.g.com covers http://ad.g.com or http://*.g.com
   * exmaple: to detect if a custom rule is conflicted with a block rule
  ###
  isSubRule = (rule, subRule)->
    matches = urlComponentReg.exec rule
    prtl1 = matches[1]
    url1 = matches[2] + matches[3]

    matches = urlComponentReg.exec subRule
    prtl2 = matches[1]
    url2 = matches[2] + matches[3]
    return false if prtl1 isnt '*' and prtl1 isnt prtl2

    url1 = url1.replace escapeRegExp, '(?:\\$&)'
    .replace /\*/g, '.*'
    url1 = '^' + url1 + '$'
    (new RegExp(url1)).test url2

  # 获取URL的queryString
  getQs = (url) ->
    "#{url}"
    .replace /^[^?]+\?/, ''
    .replace /#[^#]*/, ''


  ###*
   * parse a query string into a key-value object
   * @param  {String} qs
   * @return {Object}
  ###
  parseQs = (qs)->
    params = {}
    canDecode = true
    qs
    .split '&'
    .forEach (el)->
      parts = el.split '='
      k = parts[0]
      v = parts[1] ? ''
      if canDecode
        try
          k = decodeURIComponent k
          v = decodeURIComponent v
        catch e
          canDecode = false
      # combine array query param into an real array
      if params[ k ]?
        if not Array.isArray params[ k ]
          params[ k ] = [ params[ k ] ]
        params[ k ].push v

      else
        params[ k ] = v

    params

  ###*
   * convert key-val into an querysting: encode(key)=encode(val)
   * if val is an array, there will be an auto conversion
   * @param  {String} key
   * @param  {String|Array} val
   * @return {String}
  ###
  toQueryString = (key, val)->
    if Array.isArray val
      try
        key = decodeURIComponent key
        key = key.replace(/[]$/, '') + '[]'
        key = encodeURIComponent(key).replace '%20', '+'
      catch e
      "#{key}" + val.map (el)->
        encodeURIComponent(el).replace '%20', '+'
      .join "&#{key}="
    else
      val = encodeURIComponent(val).replace '%20', '+'
      "#{key}=#{val}"



  # get keywords list(array) in route object
  getKwdsInRoute = (router)->
    [].concat router.params, RESERVED_HOLDERS, getObjVals router.qsParams

  ###*
   * is route string valid
   * return false if invalid
   * validate string like {abc}.user.com/{hous}/d.html?hah
   * @param  {String}  route
   * @return {Boolean}
  ###
  isRouterStrValid = (route)->
    matches = urlComponentReg.exec route
    return false unless matches

    protocol = matches[1]
    # path is host + real path
    path = matches[2] + matches[3]
    # query string without prefix ?
    qs = matches[5]

    # path basic format
    console.log 'test path format:' +  path
    return false unless /^(\{\w+\}\.)*(\w+\.)+\w+\/(\{\w+\}|[a-z0-9-_\+=&%@!\.,\*\?\|~\/])*(\{\*\w+\})?$/.test path
    # {*named} should only used in the end of the path
    console.log 'test splat kwd  in the middle of the string'
    return false if /(\{\*\w+\}).+$/.test path
    if qs
      # query string basic format
      console.log 'test qs format'
      return false unless /^(([\w_\+%@!\.,\*\?\|~\/]+=\{\w+\})|([\w_\+%@!\.,\*\?\|~\/]+=[\w_\+%@!\.,\*\?\|~\/]+)|&)*$/.test qs
      # /\{\*\w+\}/  for {*named}, not allowed
      # /[?&]\{\w+\}/ or ?{named} or &{named}, not allowd
      # /\{\w+\}(?!&|$)/ for letter followed not & or eof
      console.log 'test qs {named} format'
      return false if /\{\*\w+\}/.test(qs) or /[?&]\{\w+\}/.test(qs) or /\{\w+\}(?!&|$)/.test qs

    n = route.replace /\{\*?\w+\}/g, 'xxx'
    isUrl n


  # // http://www.baidu.com/{g}-{d}/{*abc}?abc={name}&youse={bcsd}
  # // http://www.baidu.com/{g}-{d}/{*abc}?abc={name}&youse={bcsd}
  # optionalParam = /\((.*?)\)/g
  namedParam    = /\{(\(\?)?(\w+)\}/g
  splatParam    = /\{(\*\w+)\}/g
  # escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g
  escapeRegExp  = /[\-\[\]+?.,\\\^$|#\s]/g
  queryStrReg   = /([\w_\+%@!\.,\*\?\|~\/]+)=\{(\w+)\}/g
  ###*
   * convert a url pattern to a regexp
   * @param  {String} route url pattern
   * @return {Object}
   *                 {
   *                    url: match url, which url will be captured used by chrome
   *                    reg: regexp string can match an url & extract params
   *                    matchUrl: source rule, aka the in-param route
   *                    hasQs: has named params in query string
   *                    params: two array of var name of each named param in path an querystring
   *                 }
  ###
  getRouter = (route)->
    result = matchUrl: route

    protocol = route.match /^([\w\*]+)\:\/\//

    protocol = if protocol then protocol[1] else '*'
    url = protocol + '://'

    protocol = '\\w+' if protocol is '*'
    # remove protocol
    route = route.replace /^([\w\*]+)\:\/\//, ''

    # replace named holder with * in host
    url += route.replace(/^[^\/]*(\.|\{\w+\}|\w+)*\.{\w+\}/, '*')
    # replace query string with *
    .replace /\?.*$/, '*'
    # replace named holder with * in path
    .replace /\{\w+\}.*$/, '*'
    result.url = url


    parts = route.split '?'
    # route contains more than one ?
    if parts.length > 2 then return result
    result.hasQs = parts.length is 2
    params = []

    # hand named params in path
    part = parts[0].replace escapeRegExp, '\\$&'
    # .replace optionalParam, '(?:$1)?'
    .replace namedParam, (match, $1, $2)->
      params.push $2
      if $1 then match else '([^/?]+)'
    .replace splatParam, (match, $1)->
      params.push $1
      '([^?]*?)'
    reg = "^#{protocol}:\/\/#{part}(?:\\?([\\s\\S]*))?$"
    result.reg = reg
    result.params = params

    # hand named params in query string
    params = {}
    if result.hasQs
      parts[1].replace queryStrReg, ($0, $1, $2)->
        try
          $1 = decodeURIComponent $1
        catch e
        params[ $1 ] = $2
    result.qsParams = params
    result.hasQs = !!Object.keys(params).length
    result

  # pre-defined placeholders
  RESERVED_HOLDERS = ['p', 'h', 'm', 'r', 'q']
  # have reserved word in url pattern
  # return a reserved words list that has been miss used.
  hasReservedWord = (router)->
    params = getKwdsInRoute router
    res = []
    for v in RESERVED_HOLDERS
      if v in params or "%#{v}" in params or "=#{v}" in params
        res.push v
    # remove duplicated names
    res = res.filter (v, k)->
      k isnt res.indexOf v
    return res if res.length

  ###*
   * check the whether router's keywords are unique
   * return undefined if valid
   * return an array of duplicated names if found in params
   * @param  {Object}  res result returned by getRouter
   * @return {Boolean|Array|undefined}
  ###
  isKwdsUniq = (router)->
    params = getKwdsInRoute router
    res = []
    res = params.filter (v, k)-> k isnt params.indexOf v
    if res.length
      res

  # get a list from redirect to url, eg. http://{sub}.github.com/{name}/{protol}
  # %name mean encodeURIComponent name
  # =name mean decodeURIComponent name
  getRedirectParamList = (url)->
    matches = url.match(/\{(\w+)\}/g) or []
    matches.map (v)-> v.slice 1, -1

  ###*
   * redirect rule valid
   * @param  {String}  redirectUrl
   * @return {Boolean}
  ###
  isRedirectRuleValid = (redirectUrl)->
    # redirectUrl is empty
    return false unless redirectUrl
    # no params found in redirect url
    return false unless getRedirectParamList(redirectUrl).length
    # remove param placeholder and check the url
    isUrl redirectUrl.replace(/^\{\w+\}/, '*').replace /^\{\w+\}/g, 'xxx'

  ###*
   * return undefined if no undefined word, or a list contains undefined words
   * @param  {Object}  router a defined word list
   * @param  {String}  url   a url pattern that use words in refer
   * @return {Array|undefined}
  ###
  hasUndefinedWord = (router, url)->
    params = getKwdsInRoute router
    console.log 'router keywords: ' + params.join ','
    res = []
    sample = getRedirectParamList url
    console.log 'redirected kwds: ' + sample.join ','
    for v in sample
      res.push v if v not in params
    console.log 'result: ' + res.join ','
    if res.length
      res


  ###*
   * get a key-value object from the url which match the pattern
   * @param  {Object} r   {reg: ..., params: ''} from getRouter
   * @param  {String} url a real url that match that pattern
   * @return {Object}
  ###
  getUrlValues = (r, url)->
    res = {}
    try
      matches = (new RegExp(r.reg)).exec url
    catch e
      matches = ''
    return null unless matches
    # get path values
    for v, k in r.params
      res[ v ] = matches[ k + 1 ] or ''

    # get query string values
    if r.hasQs
      qsParams = parseQs getQs url

      for own k, v of r.qsParams
        res[ v ] = qsParams[ k ] or ''


    urlComponentReg.exec url
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

  # fill a pattern with data
  fillPattern = (pattern, data)->
    i = pattern.indexOf '?'
    path = pattern
    qs = ''
    if i isnt -1
      path = pattern.substr 0, i
      qs = pattern.substr i

    path = path.replace /\{(\w+)\}/g, ($0, $1)->
      val = data[ $1 ] ? ''
      # / in val, like abc/bdc, won't be encoded
      if ~val.indexOf('/') then val else encodeURIComponent val
    qs = qs and qs.replace /([\w\%+\[\]]+)=\{(\w+)\}/g, ($0, $1, $2)->
      val = data[ $2 ] ? ''
      toQueryString $1, val
    path + qs

  ###*
   * get target url
   * @param  {Object} router   url pattern to match a url
   * @param  {String} url     a real url that match route
   * @return {String}         converted url
  ###
  getTargetUrl = (router, url)->
    params = getUrlValues router, url
    return '' unless params
    fillPattern router.redirectUrl, params



  return {
    isProtocol          : isProtocol
    isIp                : isIp
    isHost              : isHost
    isPath              : isPath
    isUrl               : isUrl
    i18n                : i18n
    isSubRule           : isSubRule
    getQs               : getQs
    parseQs             : parseQs
    isRouterStrValid    : isRouterStrValid
    getRouter           : getRouter
    getUrlValues        : getUrlValues
    isRegValid          : isRegValid
    hasUndefinedWord    : hasUndefinedWord
    hasReservedWord     : hasReservedWord
    getTargetUrl        : getTargetUrl
    getUrlFromClipboard : getUrlFromClipboard
  }
)