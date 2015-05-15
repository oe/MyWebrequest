define (require)->

  collection = require 'common/collection'
  utils = require 'common/utils'
  tpl = require 'js/tpl'

  pageIds = $('#nav>li>a').map ->
    href = this.getAttribute 'href'
    if href[0] is '#'
      href.replace '#', ''
  .get()


  # check a setting section cat
  isPageCat = (cat)->
    ~pageIds.indexOf (cat or '').replace '#', ''

  # check a union cat
  # union cat: block, hotlink, hsts, etc these use a common section
  isUnionCat = (cat)->
    ~['block', 'hotlink', 'hsts', 'log'].indexOf (cat or '').replace '#', ''


  ###*
   * toggle enable state of section of cat( category )
   * @param  {String} cat
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
    $thead.find('input').prop 'checked', ruleNum and ruleNum is $tbody.find('tr input:checked').length
    return

  ###*
   * init section of cat( category )
   * @param  {[type]} cat [description]
   * @return {[type]}     [description]
  ###
  initSection = (cat)->
    # return unless utils.hasCat cat
    rules = collection.getRules cat
    # flip the rules
    # make the last added be the first
    do rules.reverse
    # init section name & description
    $('#fun-name').text $("#nav a[href^=##{cat}]").text()
    $('#fun-desc').text chrome.i18n.getMessage "opt_#{cat}_desc"

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

  # remove a rule, support multi rules
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

  # nav link clicked
  $(document).on 'click', 'a[href^=#]', (e) ->
    cat = $(this).attr('href').replace '#', ''
    return unless isPageCat cat
    $navLink = $("#nav a[href^=##{cat}]").parent()
    return if $navLink.hasClass 'active'

    location.hash = cat
    $navLink.siblings().removeClass 'active'
    $navLink.addClass 'active'

    $unionSec = $ '#request-settings'
    $unionSec.removeClass 'active'
    if isUnionCat cat
      initSection cat
      setTimeout ->
        $unionSec.addClass 'active'
        return
      , 50
    return

  # init
  do ->
    cat = location.hash.replace '#', ''
    cat = 'block' unless isPageCat cat
    console.log cat
    do $("#nav a[href^=##{cat}]").click
    return

  return
