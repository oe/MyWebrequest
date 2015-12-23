define (require)->

  # collection = require 'common/collection'
  # utils from common
  # utils = require 'common/utils'
  
  # utils from js

  pageCtrls =
    union          : require 'js/union-page'
    qrcode         : require 'js/qr-page'
    utility        : require 'js/utility-page'
    'ext-settings' : require 'js/ext-settings-page'

  pageIds = $('#nav>li>a').map ->
    href = this.getAttribute 'href'
    if href[0] is '#'
      href.replace '#', ''
  .get()

  require 'lib/artdialog/css/ui-dialog.css'
  dialog = require 'dialog'
  ###*
   * check a setting section cat
   * @param  {String}  cat cat name
   * @return {Boolean}
  ###
  isPageCat = (cat)->
    (cat or '').replace('#', '') in pageIds


  
  # nav link clicked
  $(document).on 'click', 'a[href^=#]', (e) ->
    cat = $(this).attr('href').replace '#', ''
    return unless isPageCat cat
    $navLink = $("#nav a[href^=##{cat}]").parent()
    return if $navLink.hasClass 'active'

    location.hash = cat
    $navLink.siblings().removeClass 'active'
    $navLink.addClass 'active'

    $unionCat = $ '#request-settings'
    $unionCat.removeClass 'active'
    if pageCtrls.union.isUnionCat cat
      pageCtrls.union.init cat
      setTimeout ->
        $unionCat.addClass 'active'
        return
      , 100
    else
      pageCtrls[ cat ]?.init cat
    return

  # init
  do ->
    cat = location.hash.replace '#', ''
    cat = 'custom' unless isPageCat cat
    do $("#nav a[href^=##{cat}]").click
    return

  return
