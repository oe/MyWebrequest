do (window) ->
  slice = Array.prototype.slice;
  
  elms = document.querySelectorAll '[i18n-content]'
  elms = slice.call elms

  elms.forEach (elm) ->
    elm.innerHTML = chrome.i18n.getMessage( elm.getAttribute 'i18n-content') or 'Error:No Message'
  
  elms = document.querySelectorAll '[i18n-value]'
  elms = slice.call elms
  elms.forEach (elm) ->
    attrs = elm.getAttribute('i18n-value').split ';'
    attrs.forEach (attr) ->
      attr = attr.split ':'
      if attr.length > 1
        elm.setAttribute attr[0].trim(), chrome.i18n.getMessage(attr[1].trim()) or 'Error:No values'