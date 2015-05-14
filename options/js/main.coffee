define (require)->

  collection = require 'js/collection'
  utils = require 'js/utils'
  tpl = require 'js/tpl'

  ###*
   * toggle enable state of section of cat( category )
   * @param  {Boolean} isEnable [description]
   * @return {[type]}           [description]
  ###
  resetSectionCtrlsState = (isEnable)->
    $thead = $ '#request-settings thead'
    $('#request-settings .switch-input').prop 'disabled', !isEnable
    $('#request-settings .enable-tip').prop 'hidden', isEnable
    $thead.find('input, button').prop 'disabled', !isEnable
    $thead.find('input').prop 'checked', false
    return
  ###*
   * init section of cat( category )
   * @param  {[type]} cat [description]
   * @return {[type]}     [description]
  ###
  initSection = (cat)->
    return unless utils.hasCat cat
    rules = do collection.getRules
    # flip the rules
    # make the last added be the first
    do rules.reverse
    
    ruleCount = rules.length
    hasRule = !!ruleCount
    isHsts = cat is 'hsts'
    if hasRule
      html = tpl.rulesTpl rules
    else
      html = tpl.nodataTpl
      utils.setSwitch cat, false
    # set the rule count num
    $('#request-settings .rule-cunt-num').text ruleCount
    # set the enable checkbox's state
    $('#request-settings .switch-input').prop 'checked', utils.getSwitch cat
    # enable or disable the controls
    resetSectionCtrlsState hasRule
    # hsts has special settings
    $('#protocol').val(if isHsts then 'http' else '*').attr 'disabled', isHsts
    $('#request-settings tbody').html html

    return

  # add a rule
  addRule = (cat, rule)->
    $tbody = $ '#request-settings tbody'
    $tr = $ utils.rulesTpl [ rule ]
    $tr.addClass 'new-item'

    noRule = !$tbody.children().length or $tbody.find('tr[nodata]').length

    resetSectionCtrlsState true

    $tbody[ if noRule then 'html' else 'prepend' ] $tr
    $('#request-settings .rule-cunt-num').text $tbody.find('tr').length
    $('.rule-field input').val ''
    $('#host').focus()
    collection.saveRule cat

    setTimeout ->
      $tr.removeClass 'new-item'
    , 600
    return

  removeRule = (cat, $trs)->
    $tbody = $ '#request-settings tbody'
    $trs = $tbody.find('input:checked').parents('tr') unless $trs
    return unless $tr.length
    
    rules = $trs.find('input').map ->
      this.value
    .get()

    noRule = rules.length is $tbody.find('tr').length
    utils.removeRule cat, rules

    $tr.addClass 'fadeOutDown'

    setTimeout ->
      do $tr.remove
      $('#request-settings .rule-cunt-num').text $tbody.find('tr').length
      if noRule
        $tbody.html tpl.nodataTpl
        resetSectionCtrlsState false
    , 200

    return


