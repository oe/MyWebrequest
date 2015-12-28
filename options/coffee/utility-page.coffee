define (require)->

  utils = require 'common/js/utils'
  collection = require 'common/js/collection'
  
  # init utility page
  init = (cat)->
    onoff = collection.getLocal 'onoff', 'o'
    $('#switch-google').prop 'checked', !!onoff.gsearch
    $('#switch-gstatic').prop 'checked', !!onoff.gstatic
    updateGhostText do getCustomFavorGsearch

  updateGhostText = (host)->
    $('#custom-favor-gsearch').text host
    $('#custom-favor-gsearch-wrapper').prop 'hidden', !host
    return

  getCustomFavorGsearch = ->
    host = collection.getLocal 'gsearch', 'a'
    host = if host then host[0] or '' else ''
    host.slice 4, -5

  $('#switch-google').on 'change', ->
    collection.setSwitch 'gsearch', !!this.checked
    return
  $('#switch-gstatic').on 'change', ->
    collection.setSwitch 'gstatic', !!this.checked
    return

  # press ok on the google domain edit dialog
  $('#preferred-google').on 'keyup', (e)->
    if e.keyCode is 13
      do $('#input-dialog-wrapper .js-btn-ok').click
    return

  # show google domain edit dialog
  $('#gsearch-rule-switch').on 'click', '.js-add-favor-gsearch', ->
    val = do getCustomFavorGsearch
    content = utils.i18n('input_dlg_hint') +
      '<input autofocus value="' + val + '" placeholder="' + utils.i18n('input_dlg_inputph') + '">'
    dlg = dialog
      title: utils.i18n 'input_dlg_title'
      content: content
      width: 500
      okValue: utils.i18n 'ok_btn'
      autofocus: false
      ok: ->
        $input = this._$('content').find 'input'
        onSaveFavorGsearch $input
      cancelValue: utils.i18n 'cancel_btn'
      cancel: ->
    .showModal()

    $ipt = dlg._$('content').find('input')
    # focus the cursor at the end the text
    setTimeout ->
      $ipt.focus()
      val = $ipt.val()
      $ipt.val('')
      $ipt.val(val)
    , 250
    return

  onSaveFavorGsearch = ($input)->
    host = $.trim do $input.val
    if host is ''
      collection.setLocal 'gsearch', []
      updateGhostText ''
      return
    host = do host.toLowerCase
    i = host.indexOf '\/\/'
    if i isnt -1 then host = host.substr i + 2
    i = host.indexOf '\/'
    if i isnt -1 then host = host.substr 0, i
    if utils.isIp( host ) or utils.isHost host
      arr = host.split '.'
      if arr.length is 2 and arr[0] is 'google'
        host = "www.#{host}"

      updateGhostText host
      collection.setLocal 'gsearch', [ "*://#{host}/url*" ]
    else
      dialog
        content: utils.i18n 'opt_errtip_host'
      .show $input[0]
      $input.focus()
      return false
    return


  return {
    init: init
  }