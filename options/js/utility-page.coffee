define (require)->

  utils = require 'common/utils'
  modal = require 'js/component'
  
  # init utility page
  init = (cat)->
    onoff = utils.getLocal 'onoff', 'o'
    $('#switch-google').prop 'checked', !!onoff.gsearch
    $('#switch-gstatic').prop 'checked', !!onoff.gstatic
    updateGhostText do getCustomFavorGsearch

  updateGhostText = (host)->
    $('#custom-favor-gsearch').text host
    $('#custom-favor-gsearch-wrapper').prop 'hidden', !host
    return

  getCustomFavorGsearch = ->
    host = utils.getLocal 'gsearch', 'a'
    host = if host then host[0] or '' else ''
    host.slice 4, -5

  $('#switch-google').on 'change', ->
    utils.setSwitch 'gsearch', !!this.checked
    return
  $('#switch-gstatic').on 'change', ->
    utils.setSwitch 'gstatic', !!this.checked
    return

  # press ok on the google domain edit dialog
  $('#preferred-google').on 'keyup', (e)->
    if e.keyCode is 13
      do $('#input-dialog-wrapper .js-btn-ok').click
    return

  # show google domain edit dialog
  $('#gsearch-rule-switch').on 'click', '.js-add-favor-gsearch', ->
    $('#preferred-google').val do getCustomFavorGsearch
    $wrapper = $ '#input-dialog-wrapper'
    $(document.body).addClass 'ovHidden'
    $wrapper.prop 'hidden', false
    $wrapper.addClass 'fadeInDown'
    setTimeout ->
      do $('#preferred-google').focus
      return
    , 210
    return
  # add favor google domain
  $('#input-dialog-wrapper .js-btn-ok').on 'click', ->
    host = $.trim do $('#preferred-google').val
    if host is ''
      utils.setLocal 'gsearch'
      updateGhostText ''
      modal.hideDlg '#input-dialog-wrapper'
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
        
      utils.setLocal 'gsearch', [ "*://#{host}/url*" ]
      modal.hideDlg '#input-dialog-wrapper'
    else
      modal.showTip $('#preferred-google'), utils.i18n 'opt_errtip_host'
    return

  return {
    init: init
  }