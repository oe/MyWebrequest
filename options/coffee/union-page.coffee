define (require)->
  utils = require 'common/js/utils'
  collection = require 'common/js/collection'
  modal = require 'js/component'
  tpl = require 'js/tpl'
  vars = require 'js/vars'

  UNION_PAGES = ['block', 'hotlink', 'hsts', 'log', 'custom']

  # check a union cat
  # union cat: block, hotlink, hsts, etc these use a common section
  isUnionCat = (cat)->
    (cat or '').replace('#', '') in UNION_PAGES

  # check whether the host won't disable qr feature
  isSafe4Qr = (cat, host)->
    return true if cat isnt 'block'
    str = host.replace(/\./g, '\\.').replace '*', '.*'
    not (new RegExp('^' + str + '$')).test vars.QR_API_HOST

  ###*
   * toggle enable state of section of cat( category )
   * @param  {String} cat
  ###
  resetSectionCtrlsState = (cat)->
    $thead = $ '#request-settings thead'
    $tbody = $ '#request-settings tbody'
    ruleNum = $tbody.find('tr:not([nodata])').length
    $switch = $ '#request-settings .switch-input'
    switchEnabled = collection.getSwitch cat
    
    $switch.prop
      'checked'  : switchEnabled and !!ruleNum
      'disabled' : !ruleNum
    $('#request-settings .enable-tip').prop 'hidden', !!ruleNum
    $thead.find('input, button').prop 'disabled', !ruleNum
    $('#request-settings .rule-cunt-num').text ruleNum
    $thead.find('input').prop 'checked', ruleNum and ruleNum is $tbody.find('tr input:checked').length
    return

  # remove a rule, support multi rules
  removeRule = (cat, $trs)->
    $tbody = $ '#request-settings tbody'
    $trs = $tbody.find('input:checked').parents('tr') unless $trs
    return unless $trs.length
    
    rules = $trs.find('input').map ->
      this.value
    .get()

    isRemoveAll = rules.length is $tbody.find('tr').length
    collection.removeRule cat, rules

    $trs.addClass 'fadeOutDown'

    setTimeout ->
      do $trs.remove
      $tbody.html tpl.nodataTpl if isRemoveAll

      resetSectionCtrlsState cat
      return
    , 200

    return

  # add a rule
  addRule = (cat, rule)->
    $tbody = $ '#request-settings tbody'
    $tr = $ tpl.rulesTpl [ rule ]
    $tr.addClass 'new-item'

    noRule = !$tbody.find('tr:not([nodata])').length

    $tbody[ if noRule then 'html' else 'prepend' ] $tr
    $('.rule-field input').val ''
    $('#host').focus()

    collection.addRule cat, rule
    resetSectionCtrlsState cat
    setTimeout ->
      $tr.removeClass 'new-item'
      return
    , 600
    return

  
  ###*
   * init section of cat( category )
   * @param  {String} cat
  ###
  initSection = (cat)->
    rules = collection.getRules cat

    isCustom = cat is 'custom'
    $('#request-settings .js-custom').prop 'hidden', !isCustom
    $('#request-settings .js-not-custom').prop 'hidden', isCustom
    # flip the rules
    # make the last added be the first
    do rules.reverse
    # init section name & description
    $('#fun-name').text $("#nav a[href^=##{cat}]").text()
    $('#fun-desc').text utils.i18n "opt_#{cat}_desc"

    hasRule = !!rules.length
    isHsts = cat is 'hsts'
    if hasRule
      html = tpl.rulesTpl rules
    else
      html = tpl.nodataTpl
      collection.setSwitch cat, false
    $('#request-settings tbody').html html
    # reset controls
    resetSectionCtrlsState cat

    $('#request-settings').attr 'data-id', cat
    # focus the first input
    setTimeout ->
      $('#request-settings').find('input:text:enabled:visible:first').focus()
      return
    , 300
    # hsts has special settings
    $('#protocol').val(if isHsts then 'http' else '*').attr 'disabled', isHsts

    return


  # union cat switch input
  $('#request-settings .switch-input').on 'change', (e) ->
    cat = $('#request-settings').attr 'data-id'
    collection.setSwitch cat, @checked
    return

  # input box [host] on *enter key*
  $('#host').on 'keyup', (e) ->
    if e.keyCode is 13
      $path = $ '#path'
      if $path.val() is ''
        $path.focus()
      else
        $(this).parents('.rule-field').find('.add-rule').click()
    return

  # paste string to [host] input box
  $('#host').on 'paste', (e) ->
    url = utils.getUrlFromClipboard e
    return true unless url.protocol and utils.isProtocol url.protocol
    $('#protocol').val url.protocol if not $('#protocol').prop 'disabled'
    $('#host').val url.host
    $('#path').val url.path.replace /^\//, ''
    return false

  # input box [path] on enter key
  $('#path').on 'keyup', (e) ->
    if e.keyCode is 13
      $(this).parents('.rule-field').find('.add-rule').click()
      false


  #add a simple rule for block, hotlink, log, hsts
  $('.rule-field').on 'click', '.add-rule', (e) ->
    cat = $('#request-settings').attr 'data-id'
    $protocol = $ '#protocol'
    $host = $ "#host"
    $path = $ "#path"
    data =
      protocol: $protocol.val().trim()
      host: $host.val().trim().toLowerCase()
      path: $path.val().trim()


    unless utils.isProtocol data.protocol
      modal.showTip $protocol, utils.i18n 'opt_errtip_protocol'
      return false

    unless data.host and ( utils.isIp(data.host) or utils.isHost(data.host) )
      modal.showTip $host, utils.i18n 'opt_errtip_host'
      return false

    # Path treat empty as star(*)
    data.path = '*' if data.path is ''

    unless data.path and utils.isPath data.path
      modal.showTip $path, utils.i18n 'opt_errtip_path'
      return false

    rule = "#{data.protocol}://#{data.host}/#{data.path}"
    if rule.length > 500
      modal.showTip $host, utils.i18n 'opt_errtip_rulelong'
      return false

    # whether rule is duplicated
    if ~collection.indexOfRule cat, rule
      modal.showTip $host, utils.i18n 'opt_errtip_duplicate'
      return false

    if data.host is '*'
      if ['block', 'hsts'].indexOf(cat) isnt -1
        eMsg = 'opt_errdlg_cstarqr'
      else
        eMsg = 'opt_errdlg_cstar'
    else
      # check whether the rule will disable QR feature
      eMsg = 'opt_errdlg_cqr' unless isSafe4Qr cat, data.host
    if eMsg
      modal.showDlg
        title: utils.i18n 'opt_errdlg_title'
        content: utils.i18n eMsg
        callback: addRule
        cbargs: [cat, rule]
      return
    else
      addRule cat, rule
    return
    
  # delete multi rules
  $('#request-settings .multi-delete').on 'click', (e) ->
    cat = $('#request-settings').attr 'data-id'
    len = $(this).parents('table').find('tbody input:checked').length
    if len
      modal.showDlg
        title: utils.i18n 'opt_deldlg_title'
        content: utils.i18n('opt_deldlg_content').replace 'xx', len
        callback: removeRule
        cbargs:[ cat ]

      return
    else
      modal.showTip this, utils.i18n 'opt_errtip_nochose'
      return false

  # delete on rule
  $('#request-settings tbody').on 'click', '.delete', (e) ->
    $tr = $(this).parents 'tr'
    cat = $('#request-settings').attr 'data-id'

    removeRule cat, $tr
    return

  # check all
  $('#check-all-rules').on 'change', (e)->
    $this = $ this
    checked = $this.prop 'checked'
    $table = $this.parents '.rules'
    $table.find('tbody input[type="checkbox"]').prop 'checked', checked
    $table.find('tbody tr')[if checked then 'addClass' else 'removeClass'] 'checked'
    return

  # single rule check
  $('#request-settings tbody').on 'change', 'input[type="checkbox"]', (e)->
    $this = $ this
    $tr = $this.parents 'tr'
    $tbody = $this.parents 'tbody'
    $checkAll = $ '#check-all-rules'
    if $this.prop 'checked'
      $tr.addClass 'checked'
      if $tbody.find('tr').length is $tbody.find('input:checked').length
        $checkAll.prop 'checked', true
    else
      $tr.removeClass 'checked'
      $checkAll.prop 'checked', false
    return


  # paste string to [custom host] input box
  $('#host-c').on 'paste', (e) ->
    url = utils.getUrlFromClipboard e
    return true unless url.protocol and utils.isProtocol url.protocol
    $('#protocol-c').val url.protocol if not $('#protocol').prop 'disabled'
    $('#host-c').val "#{url.host}#{url.path}"
    return false

  $('#host-c').on 'keyup', (e)->
    if e.keyCode is 13
      $('#redirect-url-input').focus()
      return false

  $('#redirect-url-input').on 'keyup', (e)->
    if e.keyCode is 13
      $('#test-url-input').focus()
      return false

  $('#test-url-input').on 'keyup', (e)->
    if e.keyCode is 13
      $('#test-url-btn').click()
      return false
  
  ###*
   * Test the custom rule with a real url
   * if pass return the rule object or nothing
  ###
  checkCustomRule = ->
    $protocol = $ '#protocol-c'
    $host = $ '#host-c'
    $redirectUrl = $ '#redirect-url-input'
    $realUrl = $ '#test-url-input'
    data =
      protocol: $protocol.val()
      host: $host.val()
      redirectUrl: $redirectUrl.val()
      realUrl: $realUrl.val()

    unless utils.isProtocol data.protocol
      modal.showTip $protocol, utils.i18n 'opt_errtip_protocol'
      return

    unless testCustom data.host
      modal.showTip $host, utils.i18n 'opt_errtip_protocol'
      return

    unless testCustom data.redirectUrl
      modal.showTip $redirectUrl, utils.i18n 'opt_errtip_protocol'
      return

    unless testCustom data.realUrl
      modal.showTip $realUrl, utils.i18n 'opt_errtip_protocol'
      return
  
    return {
      # url for chrome webrequest api to match
      url: ''
      # url with placeholder to extract the params
      matchUrl: ''
      # url template to get the new url
      redirectUrl: ''
    }


  # test url
  $('#test-url-btn').on 'click', (e)->
    do checkCustomRule


  return {
    init: initSection
    isUnionCat: isUnionCat
  }
