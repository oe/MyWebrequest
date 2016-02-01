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
    help           : require 'js/help-page'

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
  
  onHashChange = (e, hash)->
    if e
      matches = /#(.*)$/.exec e.newURL
      return unless matches
      hash = matches[1]

    hashes = hash.split '/'
    cat = hashes.shift()
    others = hashes.join '/'
    return unless isPageCat cat
    
    $navLink = $("#nav a[href^=##{cat}]").parent()
    return if $navLink.hasClass 'active'

    $navLink.siblings().removeClass 'active'
    $navLink.addClass 'active'

    $('section').removeClass 'active'

    $unionCat = $ '#request-settings'
    $unionCat.removeClass 'active'
    if pageCtrls.union.isUnionCat cat
      pageCtrls.union.init cat, others
      setTimeout ->
        $unionCat.addClass 'active'
        return
      , 100
    else
      $("section##{cat}").addClass 'active'
      pageCtrls[ cat ]?.init cat, others
    return

  window.onhashchange = onHashChange

  # init
  do ->
    cat = location.hash.replace '#', ''
    cat = 'custom' unless isPageCat cat.split('/')[0]
    onHashChange null, cat
    # do $("#nav a[href^=##{cat}]").click
    return

  return
