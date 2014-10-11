$ ($) ->
  hash = location.hash.replace('#', '') or 'block'
  rules = {}
  dialogOKCB = null
  TABNODATATR = "<tr nodata><td colspan='3' class='align-center'>#{chrome.i18n.getMessage 'opt_no_rules' }</td></tr>"

  QRAPIHOST = 'api.qrserver.com'
  QRAPIURL = 'http://api.qrserver.com/v1/create-qr-code/?size=200x200&data=%s'

  ipReg = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])$/
  hostReg = /^(\*((\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,4})?|([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,4})$/
  pathReg = /^[a-z0-9-_\+=&%@!\.,\*\?\|~\/]+$/i

  # hash init
  if ['block','hsts','hotlink','log','qrcode','help','utility'].indexOf(hash) is -1 then hash = 'block'
  do (rules = rules) ->
    rules.block = {}
    rules.hotlink = {}
    rules.log = {}
    rules.hsts = {}
    for key of rules
      # console.log key
      arr = JSON.parse localStorage[ key ] or '[]'
      rules[key].max = arr.length
      for k,i in arr
        rules[key][i] = k
    return

  # init setting section
  initRequestSection = (secId)->
    str = ''
    $tbody = $ '#request-settings tbody'
    $enable = $ '#request-settings .switch-input'
    delStr = '<td class="delete">' + chrome.i18n.getMessage('opt_delete_text') + '</td>'
    $protocol = $ '#protocol'
    $firstInput = $ '#host'
    onoff = JSON.parse localStorage.onoff or '{}'
    cunt = 0

    setTimeout (e)->
      $firstInput.focus()
    , 200
    ruleObj = rules[secId] or {}
    for key,val of ruleObj
      # only key is a number
      if !isNaN(key) and ruleObj.hasOwnProperty key
        ++cunt
        str += '<tr>'
        str +=    "<td><input type='checkbox' value='#{key}'> </td>"
        str +=    "<td title='#{val}'>#{val}</td>"
        str +=    delStr
        str += '</tr>'

    $('#request-settings .rule-cunt-num').text cunt
    if !str
      $enable.prop('checked',false).trigger 'change'
      $enable.prop 'disabled', true
      $('#request-settings .enable-tip').prop 'hidden', false
      $tbody.parent().find('thead input,thead button').prop 'disabled', true
      str = TABNODATATR
    else
      $enable.prop 'checked', !!onoff[secId]
      $enable.prop 'disabled', false
      $('#request-settings .enable-tip').prop 'hidden', true
      $tbody.parent().find('thead input,thead button').prop 'disabled', false

    $tbody.parent().find('thead input').prop 'checked', false
    if secId is 'hsts'
      $protocol.val('http').attr 'disabled',true
    else
      $protocol.val('*').attr 'disabled',false
    $tbody.html str
    return

  addRule = (rule,type,$tbody)->
    ruleObj = rules[type]
    # console.log 'init %o', ruleObj
    str = ''
    $tr = $ '<tr />'
    ++ruleObj.max

    ruleObj[ruleObj.max] = rule

    $tr.addClass 'new-item'
    str += "<td><input type='checkbox' value='#{ruleObj.max}'> </td>"
    str += "<td title='#{rule}'>#{rule}</td>"
    str += "<td class='delete'>#{chrome.i18n.getMessage('opt_delete_text')}</td>"
    $tr.html str
    if !$tbody.find('tr').length or $tbody.find('tr[nodata]').length
      $tbody.find('tr').remove()
      $('#request-settings .switch-input').prop 'disabled', false
      $tbody.parent().find('thead input,thead button').prop 'disabled', false
      $('#request-settings .enable-tip').prop 'hidden', true
    # console.log ruleObj
    # console.log getObjValues ruleObj
    localStorage[type] = JSON.stringify getObjValues ruleObj
    $tbody.prepend $tr

    $('#request-settings .rule-cunt-num').text $tbody.find('tr').length
    $('.rule-field input').val('')
    $('#host').focus()
    setTimeout ->
      $tr.removeClass 'new-item'
    , 600

  deleteRules = (secId)->
    $tbody = $ '#request-settings tbody'
    $checkTrs = $tbody.find 'tr input:checked'
    $enable = $ '#request-settings .switch-input'
    keys = $checkTrs.map ()->
      this.value
    .get()
    ruleObj = rules[secId]
    len = keys.length
    trLen = $tbody.find('tr').length
    if len
      # delete all
      if len is trLen
        $tbody.html TABNODATATR
        $tbody.parent().find('thead input').prop 'checked',false
        $tbody.parent().find('thead input,thead button').prop 'disabled',true
        $enable.prop('checked',false).trigger 'change'
        $enable.prop 'disabled', true
        $('#request-settings .enable-tip').prop 'hidden', false
        rules[secId] = {}
        ruleObj = {}
      else
        $checkTrs.map ()->
          $(this).parents('tr').remove()
        
        while len--
          delete ruleObj[ keys[len] ]

      $('#request-settings .rule-cunt-num').text trLen - len
      localStorage[secId] = JSON.stringify getObjValues ruleObj

      if !$tbody.find('tr').length
        $tbody.html TABNODATATR

  getObjValues = (obj)->
    arr = []
    for k of obj
      if !isNaN(k) and obj.hasOwnProperty k
        arr.push obj[ k ]
    # make the last be the first
    arr.reverse()

  getVcardString = ()->
    str = []
    $('#tab-vcard').find('input,textarea').map (i,el)->
      console.log el
      if el.value isnt ''
        str.push "#{el.name}:#{el.value}"
    str.join ';'
    
  isValueInObj = (obj,value)->
    for k, v of obj
      if obj.hasOwnProperty(k) and v is value
        return true
    return false
      
  hideDialog = ()->
    $overlayWrapper = $ '#confirm-dialog-wrapper'
    $overlayWrapper.removeClass 'fadeInDown'
    $overlayWrapper.addClass 'fadeOutUp'
    setTimeout ()->
      $overlayWrapper.removeClass 'fadeOutUp'
      $overlayWrapper.prop 'hidden', true
      $(document.body).removeClass 'ovHidden'
    , 220

  # //show error tip
  showTip = (el,msg)->
    $el = $ el
    $tooltip = $ '#tooltip'
    $msg = $ '#tooltip-msg'
    pos = $el.offset()
    $msg.html msg
    pos.top += $el.height() + 15
    pos.left += $el.width() / 2 - $tooltip.width() / 2
    $tooltip.css {
      top: pos.top + 'px',
      left: pos.left + 'px'
    }
    setTimeout ->
      $tooltip.addClass 'show'
      return
    , 10
      
    $el.focus().select()
    return

  showDialog = (config)->
    $overlayWrapper = $ '#confirm-dialog-wrapper'
    $dlgTitle = $ '#dialog-title'
    $dlgContent = $ '#dialog-content'
    $dlgOKBtn = $ '#dialog-ok-btn'
    $dlgCancelBtn = $ '#dialog-cancel-btn'
    config = config || {}

    $(document.body).addClass 'ovHidden'
    $overlayWrapper.prop 'hidden',false
    $overlayWrapper.addClass 'fadeInDown'

    $dlgTitle.text config.title or 'No title'
    $dlgContent.html config.content or 'No content'
    $dlgOKBtn.prop 'hidden', !!config.hideOK
    $dlgCancelBtn.prop 'hidden', !!config.hideCancel

    if $.isFunction config.callback
      dialogOKCB = config.callback
      dialogOKCB.args = if config.cbargs then config.cbargs else []
      $dlgOKBtn.removeClass 'cancel'
    else
      dialogOKCB = null

    if $.isNumeric(config.timeout) and config.timeout > 0
      setTimeout hideDialog, config.timeout

    if config.focusOnOK
      $dlgOKBtn.focus()
    else
      $dlgCancelBtn.focus()

  getCustomFavorGsearch = ->
    host = localStorage.gsearch or ''
    if host then host = JSON.parse(host)[0]
    host = host or ''
    host.slice 4, -5

  updateFavorGsearchOnview = (host)->
    $('#custom-favor-gsearch').text host
    $('#custom-favor-gsearch-wrapper').prop 'hidden', !host
    return

  # init utility page
  initUtility = ->
    onoff = JSON.parse localStorage.onoff or '{}'
    $('#switch-google').prop 'checked', !!onoff.gsearch
    $('#switch-gstatic').prop 'checked', !!onoff.gstatic
    updateFavorGsearchOnview do getCustomFavorGsearch
    return

  $(document).on 'click', 'a[href^=#]', (e) ->
    targetId = $(this).attr('href').replace '#', ''
    $navlink = $("#nav a[href=##{targetId}]").parent()
    $requestSec = $ '#request-settings'
    if $navlink.length
      if $navlink.hasClass 'active' then return
      
      $('#nav li').removeClass 'active'
      $navlink.addClass 'active'

      location.hash = targetId
      switch targetId
        when 'block','hsts','hotlink','log'
          $requestSec.attr 'data-id', targetId
          $requestSec.removeClass 'active'
          initRequestSection targetId
          $('#fun-name').text $navlink.text()
          $('#fun-desc').text chrome.i18n.getMessage "opt_#{targetId}_desc"

          setTimeout ()->
            $requestSec.addClass 'active'
          , 20
        when 'qrcode'
          $requestSec.removeClass 'active'
          setTimeout () ->
            $('#qrcode .tab-pane.active .input:first').focus()
          ,0
        when 'utility'
          $requestSec.removeClass 'active'
          do initUtility
        else
          $requestSec.removeClass 'active'
    return

  $("#nav a[href=##{hash}]").click()


  # enable & disable a feature
  $('#request-settings .switch-input').on 'change', (e) ->
    secId = $('#request-settings').attr 'data-id'
    enabled = @checked
    onoff = JSON.parse localStorage.onoff or '{}'

    onoff[ secId ] = enabled
    localStorage.onoff = JSON.stringify onoff


  # qrcode image on error
  document.getElementById('qrimg').onerror = (e) ->
    @setAttribute 'hidden', true
    showDialog {
      title: chrome.i18n.getMessage 'opt_errtip_gtitle'
      content: chrome.i18n.getMessage 'opt_errtip_gcontent'
      hideCancel: true
      focusOnOK: true
    }

  # input box [host] on *enter key*
  $('#host').on 'keyup', (e) ->
    if e.keyCode is 13
      $path = $ '#path'
      if $path.val() is ''
        $path.focus()
      else
        $(this).parents('.rule-field').find('.add-rule').click()

  # paste string to [host] input box
  $('#host').on 'paste', (e) ->
    url = e.originalEvent.clipboardData.getData 'text/plain'
    if url isnt ''
      i = url.indexOf '://'
      if ~i
        if not i then return true
        arr = url.split '://'
        if arr.length isnt 2 then return true
        tmp = arr[0].trim()
        if ['*','http','https'].indexOf(tmp) is -1 then return true
        if !$('#protocol').prop 'disabled'
          $('#protocol').val tmp

        tmp = arr[1].trim()
        arr = tmp.split '/'
        $('#host').val arr[0]
        if arr[1] isnt undefined
          arr.shift()
          # trailing hash string
          $('#path').val arr.join('/').split('#').shift()
        arr = null
        return false
      else
        arr = url.split '/'
        $('#host').val arr[0]
        if arr[1] isnt undefined
          arr.shift()
          $('#path').val arr.join('/').split('#').shift()
        arr = null
        return false
    return true

  # input box [path] on enter key
  $('#path').on 'keyup', (e) ->
    if e.keyCode is 13
      $(this).parents('.rule-field').find('.add-rule').click()
      false

  #add rule
  $('.rule-field').on 'click','.add-rule', (e) ->
    secId = $('#request-settings').attr 'data-id'
    $protocol = $ '#protocol'
    $host = $ "#host"
    $path = $ "#path"
    data = {
      protocol: $protocol.val().trim()
      host: $host.val().trim().toLowerCase()
      path: $path.val().trim()
    }
    ruleObj = rules[secId]
    $tbody = $('#request-settings tbody')

    if ['*','http','https'].indexOf(data.protocol) is -1
      showTip $protocol, chrome.i18n.getMessage 'opt_errtip_protocol'
      return false

    if !data.host or (!hostReg.test(data.host) && !ipReg.test(data.host))
      showTip $host, chrome.i18n.getMessage 'opt_errtip_host'
      return false

    # Path treat empty as star(*)
    if data.path is ''
      data.path = '*'

    if !data.path or !pathReg.test data.path
      showTip $path, chrome.i18n.getMessage 'opt_errtip_path'
      return false

    rule = "#{data.protocol}://#{data.host}/#{data.path}"
    if rule.length > 500
      showTip $host, chrome.i18n.getMessage 'opt_errtip_rulelong'
      return false

    # whether rule is duplicated
    if isValueInObj ruleObj, rule
      showTip $host,chrome.i18n.getMessage 'opt_errtip_duplicate'
      return false

    if data.host is '*'
      if ['block','hsts'].indexOf(secId) isnt -1
        errorContent = 'opt_errdlg_cstarqr'
      else
        errorContent = 'opt_errdlg_cstar'
    else
      # check whether the rule will disable QR feature
      str = data.host.replace(/\./g,'\\.').replace '*', '.*'
      if ['block'].indexOf(secId) isnt -1 and (new RegExp('^' + str + '$')).test QRAPIHOST
        errorContent = 'opt_errdlg_cqr'
    if errorContent
      showDialog {
        title: chrome.i18n.getMessage 'opt_errdlg_title'
        content: chrome.i18n.getMessage errorContent
        callback: addRule
        cbargs: [rule, secId, $tbody]
      }
      return
    else
      addRule rule, secId, $tbody
    

  # delete multi rules
  $('.rules .multi-delete').on 'click', (e) ->
    secId = $('#request-settings').attr 'data-id'
    len = $(this).parents('table').find('tbody input:checked').length
    if len
      showDialog {
        title: chrome.i18n.getMessage 'opt_deldlg_title'
        content: chrome.i18n.getMessage('opt_deldlg_content').replace 'xx', len
        callback: deleteRules
        cbargs:[ secId ]
      }
      return
    else
      showTip this, chrome.i18n.getMessage 'opt_errtip_nochose'
      return false

  # delete on rule
  $('.rules tbody').on 'click', '.delete', (e) ->
    $tr = $(this).parent()
    secId = $('#request-settings').attr 'data-id'
    key = $tr.find('input').val()

    $tr.addClass 'fadeOutDown'
    if rules[ secId ][ key ]
      delete rules[ secId ][ key ]
      localStorage[ secId ] = JSON.stringify getObjValues rules[ secId ]
    setTimeout () ->
      $tbody = $tr.parent()
      $enable = $('#request-settings .switch-input')

      $tr.remove()
      $('#request-settings .rule-cunt-num').text $tbody.find('tr').length
      trCunt = $tbody.find('tr').length
      if !trCunt
        $tbody.html TABNODATATR
        $enable.prop('checked', false).trigger 'change'
        $enable.prop 'disable', true
        $('#request-settings .enable-tip').prop 'hidden', false
        $tbody.parent().find('thead input,thead button').prop 'disabled', true
      else if trCunt is $tbody.find('input:checked').length
        $tbody.parent().find('thead input[type="checkbox"]').prop 'checked', true
    , 220

  # check all
  $('.rules thead input[type="checkbox"]').on 'click', (e)->
    $this = $ this
    checked = $this.prop 'checked'
    $table = $this.parents '.rules'
    $table.find('tbody input[type="checkbox"]').prop 'checked', checked
    if checked
      $table.find('tbody tr').addClass 'checked'
    else
      $table.find('tbody tr').removeClass 'checked'
    
  # single rule check
  $('.rules tbody').on 'click','input[type="checkbox"]', (e)->
    $this = $ this
    $tr = $this.parents 'tr'
    $tbody = $this.parents 'tbody'
    $checkAll = $this.parents('.rules').find 'thead input[type="checkbox"]'
    if $this.prop 'checked'
      $tr.addClass 'checked'
      if $tbody.find('tr').length is $tbody.find('input:checked').length
        $checkAll.prop 'checked', true
    else
      $tr.removeClass 'checked'
      $checkAll.prop 'checked', false
      
  # hide dialog when pressed escape key
  $(document).on 'keydown', (e) ->
    if e.keyCode is 27
      $overlay = $ '.overlay-wrapper:visible'
      if $overlay.length then $overlay.find('.cancel').click()
    return

  # hide tooltip when keyup or click
  $(document).on 'click keyup', (e)->
    $tooltip = $ '#tooltip'
    if $tooltip.hasClass 'show'
      $tooltip.removeClass 'show'

  # dialog cancel btn click
  $('.dialog').on 'click', '.cancel', hideDialog

  # dialog ok btn click
  $('#dialog-ok-btn').on 'click', (e)->
    hideDialog()
    if dialogOKCB
      dialogOKCB.apply null, dialogOKCB.args
      dialogOKCB.args = null
      dialogOKCB = null

  # change qr code type
  $('.nav-tabs li').on 'click', (e)->
    $this = $ this
    target = $this.attr 'data-target'
    $tabNav = $(this).parent()
    $tabNav.find('li.active').removeClass 'active'
    $this.addClass 'active'
    $tabContent = $tabNav.parent().find '.tab-content'
    $tabContent.find('.tab-pane.active').removeClass 'active in'
    $target = $tabContent.find ".tab-pane#tab-#{target}"
    $target.addClass 'active'
    setTimeout ()->
      $target.addClass 'in'
      $target.find('.input:first').focus()
    , 0

  # generate QR Code with short cut
  $('.tab-content').on 'keydown', '.input', (e)->
    if (e.ctrlKey or e.metaKey) and e.keyCode is 13
      $(this).parents('.tab-pane').find('.make-qrcode').click()
      return false

  # generate QR Code
  $('.tab-content').on 'click', '.make-qrcode', (e)->
    $this = $ this
    $tab = $this.parents '.tab-pane'
    $errorTip = $this.prev()
    $qrimg = $ '#qrimg'
    type = $tab.attr 'data-type'
    str = ''
    switch type
      when 'text'
        str = $('#s-text').val().trim()
      when 'vcard'
        str = getVcardString()
        if str
          str = 'MECARD:' + str + ';;'
      when 'msg'
        if $('#s-tel').val().trim() or $('#s-msg').val().trim()
          str = 'smsto:' + $('#s-tel').val().trim() + ':' + $('#s-msg').val().trim()

    if str isnt ''
      str = encodeURIComponent str
      if str.length > 1900
        $errorTip.text chrome.i18n.getMessage 'opt_qrtip_ovfl'
        $errorTip.prop 'hidden', false
        setTimeout (e)->
          $errorTip.prop 'hidden', true
        , 3000
        return
      imgSrc = QRAPIURL.replace '%s', str
      $('<img/>').on 'load', ->
        $qrimg.removeClass 'show'
        $qrimg.attr 'src', imgSrc
        do $(this).remove
        setTimeout ->
          $qrimg.addClass 'show'
          return
        , 0
      .attr 'src', imgSrc
    else
      $errorTip.text chrome.i18n.getMessage 'opt_qrtip_notext'
      $errorTip.prop 'hidden', false
      $tab.find('.input:first').focus()
      setTimeout (e)->
        $errorTip.prop 'hidden', true
      , 3000
      return

    if $this.is 'textarea'
      $tab = $this.next '.letter-cunt'
      if $tab.length
        $tab.text str.length + '/300'
    return

  # qr textarea input length count
  $('.letter-cunt-wrapper').on 'keyup', 'textarea', (e)->
    $(this).next().text this.value.trim().length + '/300'
    return

  $('#switch-google').on 'change', ->
    onoff = JSON.parse localStorage.onoff or '{}'
    if this.checked
      onoff[ 'gsearch' ] = true
    else
      onoff[ 'gsearch' ] = false
    localStorage.onoff = JSON.stringify onoff
    console.log 'google changed'
    return
  
  $('#gsearch-rule-switch').on 'click', '.js-add-favor-gsearch', ->
    $('#preferred-google').val do getCustomFavorGsearch
    $wrapper = $ '#input-dialog-wrapper'
    $(document.body).addClass 'ovHidden'
    $wrapper.prop 'hidden',false
    $wrapper.addClass 'fadeInDown'
    setTimeout ->
      do $('#preferred-google').focus
      return
    , 210
    return

  $('#preferred-google').on 'keyup', (e)->
    if e.keyCode is 13
      do $('#input-dialog-wrapper .js-btn-ok').click
    return
  
  hideInputDialog = ->
    $overlayWrapper = $ '#input-dialog-wrapper'
    $overlayWrapper.removeClass 'fadeInDown'
    $overlayWrapper.addClass 'fadeOutUp'
    setTimeout ()->
      $overlayWrapper.removeClass 'fadeOutUp'
      $overlayWrapper.prop 'hidden', true
      $(document.body).removeClass 'ovHidden'
    , 220
    return

  $('#input-dialog-wrapper .cancel').on 'click', hideInputDialog
    

  $('#input-dialog-wrapper .js-btn-ok').on 'click', ->
    host = $.trim do $('#preferred-google').val
    if host is ''
      localStorage.gsearch = JSON.stringify []
      updateFavorGsearchOnview ''
    else
      host = do host.toLowerCase
      i = host.indexOf '\/\/'
      if i isnt -1 then host = host.substr i + 2
      i = host.indexOf '\/'
      if i isnt -1 then host = host.substr 0, i
      if ipReg.test(host) or hostReg.test host
        arr = host.split '.'
        if arr.length is 2 and arr[0] is 'google'
          host = "www.#{host}"

        updateFavorGsearchOnview host
        
        host = "*://#{host}/url*"
        localStorage.gsearch = JSON.stringify [ host ]
        # debugger
      else
        showTip $('#preferred-google'), chrome.i18n.getMessage 'opt_errtip_host'
        return
      
    do hideInputDialog
    return

  $('#switch-gstatic').on 'change', ->
    onoff = JSON.parse localStorage.onoff or '{}'
    if this.checked
      onoff[ 'gstatic' ] = true
    else
      onoff[ 'gstatic' ] = false
    localStorage.onoff = JSON.stringify onoff
    console.log 'google changed'
    return

  return





