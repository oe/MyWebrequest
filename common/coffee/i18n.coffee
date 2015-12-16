###*
 * auto i18n the web page
###
do (window) ->
  slice = Array.prototype.slice

  if navigator.userAgent.indexOf('Macintosh') > -1
    makeBtns = slice.call document.querySelectorAll '.make-qrcode'
    makeBtns.forEach (btn)->
      btn.setAttribute 'i18n-content', 'qr_make_mac_btn'
      return

  elms = document.querySelectorAll '[i18n-content]'
  elms = slice.call elms

  elms.forEach (elm) ->
    if msgId = elm.getAttribute 'i18n-content'
      elm.innerHTML = chrome.i18n.getMessage( msgId ) or 'Error:No Message'
    return
  
  elms = document.querySelectorAll '[i18n-value]'
  elms = slice.call elms
  elms.forEach (elm) ->
    attrs = elm.getAttribute('i18n-value').split ';'
    attrs.forEach (attr) ->
      attr = attr.split ':'
      if attr.length > 1
        elm.setAttribute attr[0].trim(), chrome.i18n.getMessage(attr[1].trim()) or 'Error:No values'
      return
    return

  return