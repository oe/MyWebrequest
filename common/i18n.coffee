do (window) ->
  slice = Array.prototype.slice;
  
  elms = document.querySelectorAll '[i18n-content]'
  elms = slice.call elms

  elms.forEach (elm) ->
    elm.innerHTML = (chrome.i18n.getMessage elm.getAttribute 'i18n-content') or 'Error:No Message'
  
  
