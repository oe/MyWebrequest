do ->
  blockrule = {}
  hstsrule = {}
  logrule = {}
  referrule = {}
  logNum = 0
  requestCache = {}
  goRuleBasic = ['*://www.google.com/url*','*://www.google.com.hk/url*']
  goRule =
    urls: goRuleBasic

  # 克隆对象
  cloneObj = (o) ->
    if o is null or o not instanceof Object
      return o
    if Array.isArray o
      if o.length > 1
        obj = []
        for i,k in o
          obj[ k ] = if i instanceof Object then cloneObj(i) else i
        obj
      else
        o[0]
    else
      obj = {}
      for val, key of o
        obj[ val ] = if key instanceof Object then cloneObj key else key
      obj

  # 获取URL的queryString
  getQueryString = (url) ->
    anchor = document.createElement 'a'
    anchor.href = url
    qstr = anchor.search
    anchor = null
    qstr

  # 格式化query string
  formatQstr = (url) ->
    qstr = getQueryString url
    qstr = if qstr then qstr.replace /^\?/,''
    if !qstr then return false
    arr = qstr.split '&'
    result = {}
    try
      for i in arr
        pair = i.split '='
        key = decodeURIComponent pair[0]
        val = if val is undefined then '' else decodeURIComponent pair[1]
        if result[ key ] is undefined
          result[ key ] = val
        else
          if Array.isArray result[ key ]
            result[ key ].push val
          else
            result[ key ] = [ result[ key ] ]
            result[ key ].push val
      {
        formatedData: result
      }
    catch e
      if e instanceof URIError
        result.error = 'The query string is not encoded with utf-8, this can\'t be decoded by now.'
      else
        result.error = e.message
      result

  # 格式化http headers
  formatHeaders = (headers) ->
    obj = {}
    for val in headers
      obj[ val.name ] = val.value
    obj

  # 屏蔽请求
  blockReq = (details) ->
    { cancel: true }

  # 强制加密链接
  hstsReq = (details) ->
    { redirectUrl: details.url.replace 'http://','https://' }

  # 取消Google搜索结果重定向
  cancelGoogleRedirect = (details) ->
    url = formatQstr(details.url).formatedData
    url = url?.url
    console.log 'google urls %s', url
    if !url
      url = details.url
    { redirectUrl: url }

  # 修改HTTP header中的referrer
  modifyReferer = (details) ->
    headers = details.requestHeaders
    for i,k in headers
      if i.name is 'Referer'
        header.split k,1
        break
    { requestHeaders: headers }

  # 记录请求的body, 主要针对post, put请求
  logBody = (details) ->
    if details.requestBody
      requestCache[ details.requestId ] = cloneObj details.requestBody

  # 记录请求
  logRequest = (details) ->
    ++logNum
    url = details.url
    rid = details.requestId
    queryBody = formatQstr details.url
    i = url.indexOf '//'
    domain = url.indexOf '/', i + 2
    if ~domain
      domain = url.substr 0, domain
    else
      domain = url
    if requestCache[ rid ]
      details.requestBody = requestCache[ rid ]
    details.requestHeaders = formatHeaders details.requestHeaders
    if queryBody
      details.queryBody = queryBody
    console.log '%c%d %o %csent to domain: %s','color: #086', logNum, details, 'color: #557c30', domain
    # 删除已打印的请求的缓存
    delete requestCache[id]

  # 推送消息提醒, Chrome不同版本的API不一致, 故添加此函数
  pushNotification = do->
    if chrome.notifications
      (title, content)->
        chrome.notifications.create '',
          type: 'basic'
          iconUrl: '/img/icon48.png'
          title: title
          message: content
        , ->
        return
    else if window.webkitNotifications
      (title,content)->
        notifi = webkitNotifications.createNotification '/img/icon48.png', title, content
        do notifi.show
        return
    else
      ->
    


  # init, 检测配置中各个功能的开启状态, 予以开启或关闭
  do ->
    
    onoff = JSON.parse localStorage.onoff or '{}'
    nogooredir = JSON.parse localStorage.nogooredir or '[]'
    blockrule.urls = JSON.parse localStorage.block or '[]'
    hstsrule.urls = JSON.parse localStorage.hsts or '[]'
    referrule.urls = JSON.parse localStorage.refer or '[]'
    logrule.urls = JSON.parse localStorage.log or '[]'
    reqApi = chrome.webRequest

    if onoff.nogooredir
      goRule.urls = goRule.urls.concat nogooredir
      reqApi.onBeforeRequest.addListener cancelGoogleRedirect, goRule, [ 'blocking' ]
    else
      onoff.nogooredir = false

    if onoff.block and blockrule.urls.length
      reqApi.onBeforeRequest.addListener blockReq, blockrule, [ 'blocking' ]
    else
      onoff.block = false

    if onoff.hsts and hstsrule.urls.length
      reqApi.onBeforeRequest.addListener hstsReq, hstsrule, [ 'blocking' ]
    else
      onoff.hsts = false

    if onoff.refer and referrule.urls.length
      reqApi.onBeforeRequest.addListener modifyReferer, referrule, [ 'requestHeaders', 'blocking' ]
    else
      onoff.refer = false

    if onoff.log and logrule.urls.length
      # 监控网络请求是比较耗费资源的, 所以如果浏览器开启时检测到监控网络请求功能处于开启状态, 则会弹出通知
      pushNotification chrome.i18n.getMessage('bg_logison'), chrome.i18n.getMessage('bg_logon_tip')
      reqApi.onBeforeRequest.addListener logBody, logrule, [ 'requestBody' ]
      reqApi.onSendHeaders.addListener logRequest, logrule, [ 'requestHeaders' ]
    else
      onoff.log = false

    localStorage.onoff = JSON.stringify onoff

  # 监听localStroage的storage事件, 即监听配置信息的变化
  window.addEventListener 'storage', (event) ->
    console.log 'event fired %o', event
    type = event.key
    reqApi = chrome.webRequest
    newData = JSON.parse event.newValue or '[]'
    oldData = JSON.parse event.oldValue or '[]'
    onoff = JSON.parse localStorage.onoff or '{}'

    switch type
      when 'block'
        blockrule.urls = newData
        if onoff.block
          reqApi.onBeforeRequest.removeListener blockReq
          setTimeout (fn, filter) ->
            reqApi.onBeforeRequest.addListener fn, filter, [ 'blocking' ]
          , 0, blockReq, blockrule

      when 'hsts'
        hstsrule.urls = newData
        if onoff.hsts
          reqApi.onBeforeRequest.removeListener hstsReq
          setTimeout (fn, filter) ->
            reqApi.onBeforeRequest.addListener fn, filter, [ 'blocking' ]
          , 0, hstsReq, hstsrule

      when 'refer'
        referrule.urls = newData
        if onoff.refer
          reqApi.onBeforeRequest.removeListener modifyReferer
          setTimeout (fn, filter) ->
            reqApi.onBeforeRequest.addListener fn, filter, [ 'requestHeaders','blocking' ]
          , 0, modifyReferer, referrule

      when 'log'
        logrule.urls = newData
        if onoff.log
          reqApi.onBeforeRequest.removeListener logBody
          reqApi.onSendHeaders.removeListener logRequest
          setTimeout (fnBR, fnSH, filter) ->
            reqApi.onBeforeRequest.addListener fnBR, filter, [ 'requestBody' ]
            reqApi.onSendHeaders.addListener fnSH, filter, [ 'requestHeaders' ]
          , 0, logBody, logRequest, logrule

      when 'nogooredir'
        goRule.urls = goRuleBasic.concat newData
        if onoff.nogooredir
          reqApi.onBeforeRequest.removeListener cancelGoogleRedirect
          setTimeout (fn, filter) ->
            reqApi.onBeforeRequest.addListener fn,filter, [ 'blocking' ]
          , 0, cancelGoogleRedirect, goRule

      when 'onoff'
        console.log 'onoff change...'
        if newData.nogooredir isnt oldData.nogooredir
          console.log 'google noredirection...'
          if newData.nogooredir
            reqApi.onBeforeRequest.addListener cancelGoogleRedirect, goRule, [ 'blocking' ]
          else
            reqApi.onBeforeRequest.removeListener cancelGoogleRedirect
        if newData.block isnt oldData.block
          if newData.block
            reqApi.onBeforeRequest.addListener blockReq, blockrule, [ 'blocking' ]
          else
            reqApi.onBeforeRequest.removeListener blockReq
        if newData.hsts isnt oldData.hsts
          if newData.hsts
            reqApi.onBeforeRequest.addListener hstsReq, hstsrule, [ 'blocking' ]
          else
            reqApi.onBeforeRequest.removeListener hstsReq
        if newData.refer isnt oldData.refer
          if newData.refer
            reqApi.onBeforeRequest.addListener modifyReferer, referrule, [ 'requestHeaders', 'blocking' ]
          else
            reqApi.onBeforeRequest.removeListener modifyReferer
        if newData.log isnt oldData.log
          if newData.log
            reqApi.onBeforeRequest.addListener logBody, logrule, [ 'requestBody' ]
            reqApi.onSendHeaders.addListener logRequest, logrule, [ 'requestHeaders' ]
          else
            reqApi.onBeforeRequest.removeListener logBody
            reqApi.onSendHeaders.removeListener logRequest

  return


