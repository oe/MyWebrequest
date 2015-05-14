define (require)->

  collection = require 'js/collection'
  utils = require 'js/utils'
  tpl = require 'js/tpl'

  ###*
   * toggle enable state of section of cat( category )
   * @param  {Boolean} isEnable [description]
   * @return {[type]}           [description]
  ###
  resetSectionCtrlsState = (cat)->
    $thead = $ '#request-settings thead'
    $tbody = $ '#request-settings tbody'
    ruleNum = $tbody.find('tr:not([nodata])').length
    $switch = $ '#request-settings .switch-input'
    switchEnabled = utils.getSwitch cat
    
    $switch.prop
      'checked'  : switchEnabled and !!ruleNum
      'disabled' : !ruleNum
    $('#request-settings .enable-tip').prop 'hidden', !!ruleNum
    $thead.find('input, button').prop 'disabled', !ruleNum
    $('#request-settings .rule-cunt-num').text ruleNum
    $thead.find('input').prop 'checked', ruleNum is $tbody.find('tr input:checked').length
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
    
    hasRule = !!rules.length
    isHsts = cat is 'hsts'
    if hasRule
      html = tpl.rulesTpl rules
    else
      html = tpl.nodataTpl
      utils.setSwitch cat, false
    $('#request-settings tbody').html html
    # reset controls
    resetSectionCtrlsState cat
    # hsts has special settings
    $('#protocol').val(if isHsts then 'http' else '*').attr 'disabled', isHsts

    return

  # add a rule
  addRule = (cat, rule)->
    $tbody = $ '#request-settings tbody'
    $tr = $ utils.rulesTpl [ rule ]
    $tr.addClass 'new-item'

    noRule = !$tbody.find('tr:not([nodata])').length

    $tbody[ if noRule then 'html' else 'prepend' ] $tr
    $('.rule-field input').val ''
    $('#host').focus()

    collection.saveRule cat
    resetSectionCtrlsState cat
    setTimeout ->
      $tr.removeClass 'new-item'
      return
    , 600
    return

  removeRule = (cat, $trs)->
    $tbody = $ '#request-settings tbody'
    $trs = $tbody.find('input:checked').parents('tr') unless $trs
    return unless $tr.length
    
    rules = $trs.find('input').map ->
      this.value
    .get()

    isRemoveAll = rules.length is $tbody.find('tr').length
    utils.removeRule cat, rules

    $tr.addClass 'fadeOutDown'

    setTimeout ->
      do $tr.remove
      $tbody.html tpl.nodataTpl if isRemoveAll

      resetSectionCtrlsState cat
      return
    , 200

    return


