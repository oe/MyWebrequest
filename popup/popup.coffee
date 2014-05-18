getEle = document.getElementById.bind document
qrelm = getEle 'qrcode-wrapper'
qrimg = getEle 'qrcode'
cunt = getEle 'letter-cunt'
textArea = getEle 'text'
qrUrl = 'http://chart.apis.google.com/chart?cht=qr&chs=200x200&chld=L|0&choe=UTF-8&chl='

qrimg.onerror = (e) -> getEle('ntwk-error').removeAttribute 'hidden'

chrome.tabs.query active: true, lastFocusedWindow: true, (tabs) ->
    content = tabs[0].url
    textArea.value = content
    qrimg.src = qrUrl + encodeURIComponent content 

makeQRCode = () -> 
  encoded = '';
  getEle('prompt').innerHTML = chrome.i18n.getMessage 'pop_get_new'
  encoded = encodeURIComponent text.value;
  textWrapper = getEle 'text-wrapper'
  tooLong = getEle 'long-error'
  if encoded.length > 1900
    textWrapper.classList.add 'error'
    tooLong.removeAttribute 'hidden'
    setTimeout () ->
      textWrapper.classList.remove 'error'
      tooLong.setAttribute 'hidden'
    , 3000
    return

  qrimg.src = qrUrl + encoded
  textWrapper.classList.remove 'focus'
  qrelm.style.display = 'block'
  getEle('ntwk-error').setAttribute 'hidden', true

  getEle('action-tip').innerText = chrome.i18n.getMessage 'pop_action_tip'
  qrelm.focus()


qrelm.addEventListener 'dblclick', (e) ->
  getEle('prompt').innerText = chrome.i18n.getMessage 'pop_edit_promp'
  getEle('action-tip').innerText = chrome.i18n.getMessage 'pop_edit_tip'
  @style.display = 'none'
  textWrapper.classList.add 'focus'
  cunt.innerText = "#{content.length}/300"
  textArea.select()
  textArea.focus()
,false

textArea.addEventListener 'keydown', (e) ->
  if (e.ctrlKey or e.metaKey) and e.keyCode is 13
    makeQRCode()
,false

textArea.addEventListener 'keyup', (e) ->
  cunt.innerText = "#{@value.trim().length}/300";
,false

getEle('make').addEventListener 'click', makeQRCode, false