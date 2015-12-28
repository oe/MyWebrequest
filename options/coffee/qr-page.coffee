define (require)->
  utils = require 'common/js/utils'
  vars = require 'js/vars'
  QRAPIURL = vars.QR_API_URL

  init = (cat)->
    setTimeout ->
      $('#qrcode .tab-content').find(':input:visible:first').focus()
      return
    , 300

  # change qr code type
  $('#qrcode .nav-tabs li').on 'click', (e)->
    $this = $ this
    target = $this.attr 'data-target'
    $this.siblings().removeClass 'active'
    $this.addClass 'active'
    $tabContent = $ '#qrcode .tab-content'
    $tabContent.find('.tab-pane.active').removeClass 'active in'
    $target = $tabContent.find ".tab-pane#tab-#{target}"
    $target.addClass 'active'
    setTimeout ()->
      $target.addClass 'in'
      $target.find('.input:first').focus()
    , 0

  # generate QR Code with short cut
  $('#qrcode .tab-content').on 'keydown', '.input', (e)->
    if (e.ctrlKey or e.metaKey) and e.keyCode is 13
      $(this).parents('.tab-pane').find('.make-qrcode').click()
      return false

  # qrcode image on error
  document.getElementById('qrimg').onerror = (e) ->
    @setAttribute 'hidden', true
    dialog
      title: utils.i18n 'opt_errtip_gtitle'
      content: utils.i18n 'opt_errtip_gcontent'
      okValue: utils.i18n 'ok_btn'
      ok: ->
    return

  # get vard info
  getVcardString = ()->
    str = []
    $('#tab-vcard').find('input,textarea').map (i, el)->
      if el.value isnt ''
        str.push "#{el.name}:#{el.value}"
    str.join ';'

  showQrErrTip = ($div, msg)->
    $div.text msg
    $div.prop 'hidden', false
    setTimeout ->
      $div.prop 'hidden', true
      return
    , 3000
    return
  
  getQrText = (type)->
    str = ''
    switch type
      when 'text'
        str = $('#s-text').val().trim()
      when 'vcard'
        str = getVcardString()
        str = 'MECARD:' + str + ';;' if str
      when 'msg'
        if $('#s-tel').val().trim() or $('#s-msg').val().trim()
          str = 'smsto:' + $('#s-tel').val().trim() + ':' + $('#s-msg').val().trim()
    return str

  $('#qrimg').on 'load', ->
    $('#qrimg').addClass 'show'
    return
  loadQrImg = (src)->
    $('#qrimg').removeClass('show').attr 'src', src
    return

  # generate QR Code
  $('#qrcode .tab-content').on 'click', '.make-qrcode', (e)->
    $this = $ this
    $tab = $this.parents '.tab-pane'
    $eMsg = $this.prev()
    
    type = $tab.attr 'data-type'
    str = getQrText type
    
    if str is ''
      showQrErrTip $eMsg, utils.i18n 'opt_qrtip_notext'
      $tab.find('.input:first').focus()
      return

    str = encodeURIComponent str
    if str.length > 1900
      showQrErrTip $eMsg, utils.i18n 'opt_qrtip_ovfl'
      return

    $qrimg = $ '#qrimg'

    loadQrImg QRAPIURL.replace '%s', str

    return

  # qr textarea input length count
  $('.letter-cunt-wrapper').on 'keyup', 'textarea', (e)->
    $(this).next().text this.value.trim().length + '/300'
    return

  return {
    init: init
  }