$ ($) ->
  hash = location.hash.replace('#', '') or 'block'
  rules = {}
  dialogOKCB = null
  TABNODATATR = "<tr nodata><td colspan='3' class='align-center'>#{chrome.i18n.getMessage 'opt_no_rules' }</td></tr>";

  # hash init
  if ['block','hsts','refer','log','qrcode','help','utility'].indexOf(hash) isnt -1 then hash = 'block';
  do (rules = rules) ->
    rules.block = {}
    rules.refer = {}
    rules.log = {}
    rules.hsts = {}
    for key, val of rules
      console.log key
      arr = JSON.parse localStorage[ key ] or '[]'
      for i,k in arr
        val[i] = k
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

      if ['block','hsts','refer','log'].indexOf(targetId) isnt -1
        $requestSec.attr 'data-id', targetId
        $requestSec.removeClass 'active'
        initRequestSection targetId
        $('#fun-name').text $navlink.text()
        $('#fun-desc').text chrome.i18n.getMessage "opt_#{targetId}_desc"

        setTimeout ()->
          $requestSec.addClass 'active'
        , 20
      else
        $requestSec.removeClass 'active'
        if targetId is 'qrcode'
          setTimeout () ->
            $('#qrcode .tab-pane.active .input:first').focus()
          ,0

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
    showDialog
      title: chrome.i18n.getMessage 'opt_errtip_gtitle'
      content: chrome.i18n.getMessage 'opt_errtip_gcontent'
      hideCancel: true
      focusOnOK: true

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
        if (!i) return true;
        arr = url.split('://');
        if arr.length isnt 2 then return true;
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
    data = 
      protocol: $protocol.val().trim(),
      host: $host.val().trim().toLowerCase(),
      path: $path.val().trim()
    ipReg = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])$/
    hostReg = /^(\*((\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,4})?|([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,4})$/
    pathReg = /^[a-z0-9-_\+=&%@!\.,\*\?\|~\/]+$/i
    ruleObj = rules[secId],
    $tbody = $('#request-settings tbody')

    if ['*','http','https'].indexOf(data.protocol) is -1
      showTip $protocol, chrome.i18n.getMessage 'opt_errtip_protocol'
      return

    if !data.host or (!hostReg.test(data.host) && !ipReg.test(data.host))
      showTip $host, chrome.i18n.getMessage 'opt_errtip_host'
      return

    # Path treat empty as star(*)
    if data.path is ''
      data.path = '*'

    if !data.path or !pathReg.test data.path
      showTip $path, chrome.i18n.getMessage 'opt_errtip_path'
      return

    rule = "#{data.protocol}://#{data.host}/#{data.path}"
    if rule.length > 500
      showTip $host, chrome.i18n.getMessage 'opt_errtip_rulelong'
      return

    # whether rule is duplicated
    if isValueInObj ruleObj, rule
      showTip($host,chrome.i18n.getMessage('opt_errtip_duplicate'));
      return false;

    if data.host is '*'
      if ['block','hsts'].indexOf(secId) isnt -1
        showDialog
          title: chrome.i18n.getMessage 'opt_errdlg_title'
          content: chrome.i18n.getMessage 'opt_errdlg_cstarqr'
          callback: addRule
          cbargs:[rule, secId, $tbody, $host, $path]
        return
      else
        showDialog
          title: chrome.i18n.getMessage 'opt_errdlg_title'
          content: chrome.i18n.getMessage 'opt_errdlg_cstar'
          callback: addRule
          cbargs: [rule, secId, $tbody, $host, $path]
        return

    # check whether the rule will disable QR feature
    str = data.host.replace(/\./g,'\\.').replace '*', '.*'
    if ['block','hsts'].indexOf(secId) isnt -1 and (new RegExp('^' + str + '$')).test 'chart.apis.google.com'
      showDialog
        title: chrome.i18n.getMessage 'opt_errdlg_title'
        content: chrome.i18n.getMessage 'opt_errdlg_cqr'
        callback: addRule,
        cbargs: [rule, secId, $tbody, $host, $path]
      return

    addRule rule, secId, $tbody, $host, $path

  # delete multi rules
  $('.rules .multi-delete').on 'click', (e) ->
    secId = $('#request-settings').attr 'data-id'
    len = $(this).parents('table').find('tbody input:checked').length
    if len
      showDialog
        title: chrome.i18n.getMessage 'opt_deldlg_title'
        content: chrome.i18n.getMessage('opt_deldlg_content').replace 'xx', len
        callback: deleteRules
        cbargs:[ secId ]
      return
    else
      showTip this, chrome.i18n.getMessage 'opt_errtip_nochose'
      return

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
    , 10
      
    
    
    

      
    









