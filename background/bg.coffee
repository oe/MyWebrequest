do ->
  gsearchRuleBasic = ['*://www.google.com/url*','*://www.google.com.hk/url*']
  _rules =
    block: {}
    hsts: {}
    log: {}
    hotlink: {}
    gsearch: { urls: gsearchRuleBasic }
    gstatic: { urls:['http://ajax.googleapis.com/*','http://fonts.googleapis.com/*'] }
  logNum = 0
  requestCache = {}

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

  # 推送消息提醒, Chrome不同版本的API不一致, 故添加此函数
  pushNotification = do->
    if chrome.notifications
      (title, content, notifiId, cb)->
        notifiId = notifiId or ''
        chrome.notifications.create notifiId,
          type: 'basic'
          iconUrl: '/img/icon48.png'
          title: title
          message: content
        , ->
        if notifiId and cb instanceof Function
          chrome.notifications.onClicked.addListener (nId)->
            if nId is notifiId then do cb
            return
        return
    else if window.webkitNotifications
      (title,content)->
        notifi = webkitNotifications.createNotification '/img/icon48.png', title, content
        do notifi.show
    else
      ->
    

  # 请求的监听事件
  onRequests =
    # 取消Google搜索结果重定向
    gsearch:
      fn:  (details) ->
        url = formatQstr(details.url).formatedData
        url = url?.url
        if !url
          url = details.url
        { redirectUrl: url }
      permit: [ 'blocking' ]
      on: 'onBeforeRequest'
    # 屏蔽请求
    block:
      fn: (details)->
        {cancel: true}
      permit: [ 'blocking' ]
      on: 'onBeforeRequest'
    # 强制加密链接
    hsts:
      fn: (details)->
        { redirectUrl: details.url.replace /^http\:\/\//,'https://' }
      permit: [ 'blocking' ]
      on: 'onBeforeRequest'
    # 修改HTTP header中的referrer
    hotlink:
      fn: (details) ->
        headers = details.requestHeaders
        for i,k in headers
          if i.name is 'Referer'
            header.split k,1
            break
        { requestHeaders: headers }
      permit: [ 'requestHeaders', 'blocking' ]
      on: 'onBeforeSendHeaders'
    # 记录请求的body, 主要针对post, put请求
    logBody:
      fn:  (details) ->
        if details.requestBody
          requestCache[ details.requestId ] = cloneObj details.requestBody
      permit: [ 'requestBody' ]
      on: 'onBeforeRequest'
    # 记录请求
    logRequest:
      fn: (details) ->
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
      permit: [ 'requestHeaders' ]
      on: 'onSendHeaders'
    # Google cdn 跳转至360镜像cdn
    gstatic:
      fn: (details)->
        { redirectUrl: details.url.replace 'googleapis.com', 'useso.com' }
      permit: [ 'blocking' ]
      on: 'onBeforeRequest'


  # init, 检测配置中各个功能的开启状态, 予以开启或关闭
  do ->
    onoff = JSON.parse localStorage.onoff or '{}'
    # 初始化rules
    rule
    for own k, v of _rules
      rule = JSON.parse localStorage[ k ] or '[]'
      if v.urls
        v.urls = v.urls.concat rule
      else
        v.urls = rule

    reqApi = chrome.webRequest
    onRequest = null
    # 启用各个特性
    for own k, v of _rules
      if onoff[ k ]
        if k is 'log'
          pushNotification chrome.i18n.getMessage('bg_logison'), chrome.i18n.getMessage('bg_logon_tip'), 'log-enabled-hint', ->
            window.open '/options/index.html#log'
            return
          onRequest = onRequests['logBody']
          reqApi[ onRequest.on ].addListener onRequest.fn, _rules[ k ], onRequest.permit
          onRequest = onRequests['logRequest']
          reqApi[ onRequest.on ].addListener onRequest.fn, _rules[ k ], onRequest.permit
        else
          onRequest = onRequests[ k ]
          # console.log _rules[ k ], onRequest.on, onRequest.fn, onRequest.permit
          reqApi[ onRequest.on ].addListener onRequest.fn, _rules[ k ], onRequest.permit
      else
        onoff[ k ] = false
    # 保存规则
    localStorage.onoff = JSON.stringify onoff
    return

  # 监听localStroage的storage事件, 即监听配置信息的变化
  window.addEventListener 'storage', (event) ->
    # console.log 'event fired %o', event
    type = event.key
    reqApi = chrome.webRequest
    newData = JSON.parse event.newValue or '[]'
    oldData = JSON.parse event.oldValue or '[]'
    onoff = JSON.parse localStorage.onoff or '{}'

    onRequest = null
    if type is 'onoff'
      for own k of _rules
        if newData[ k ] isnt oldData[ k ]
          if newData[ k ]
            if k is 'log'
              onRequest = onRequests['logBody']
              reqApi[ onRequest.on ].addListener onRequest.fn, _rules[ k ], onRequest.permit
              onRequest = onRequests['logRequest']
              reqApi[ onRequest.on ].addListener onRequest.fn, _rules[ k ], onRequest.permit
            else
              onRequest = onRequests[ k ]
              reqApi[ onRequest.on ].addListener onRequest.fn, _rules[ k ], onRequest.permit
          else
            if k is 'log'
              onRequest = onRequests['logBody']
              reqApi[ onRequest.on ].removeListener onRequest.fn
              onRequest = onRequests['logRequest']
              reqApi[ onRequest.on ].removeListener onRequest.fn
              requestCache = {}
            else
              onRequest = onRequests[ k ]
              reqApi[ onRequest.on ].removeListener onRequest.fn
          
    else
      _rules[ type ].urls = newData
      if type is 'gsearch'
        _rules[ type ].urls = _rules[ type ].urls.concat gsearchRuleBasic
      
      if onoff[ type ]
        if type is 'log'
          reqApi[ onRequests['logBody'].on ].removeListener onRequests['logBody'].fn
          reqApi[ onRequests['logRequest'].on ].removeListener onRequests['logRequest'].fn
          setTimeout ->
            onRequest = onRequests['logBody']
            reqApi[ onRequest.on ].addListener onRequest.fn, _rules[ type ], onRequest.permit
            onRequest = onRequests['logRequest']
            reqApi[ onRequest.on ].addListener onRequest.fn, _rules[ type ], onRequest.permit
            return
          , 0
        else
          onRequest = onRequests[ type ]
          reqApi[ onRequest.on ].removeListener onRequest.fn
          setTimeout ->
            # console.log _rules[ type ], onRequest.on, onRequest.fn, onRequest.permit
            reqApi[ onRequest.on ].addListener onRequest.fn, _rules[ type ], onRequest.permit
            return
          , 0
    return

  return