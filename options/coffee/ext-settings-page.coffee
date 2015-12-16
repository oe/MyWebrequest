define (require)->
  collection = require 'common/js/collection'
  iconStyles = [ 'colored', 'grey' ]
  init = ->
    iconStyle = collection.getConfig 'iconStyle'
    iconStyle = 'colored' if -1 is iconStyles.indexOf iconStyle
    $("#ext-iconstyle-switch input[value='#{iconStyle}']").prop 'checked', true
    return

  # change extension icon
  $('#ext-iconstyle-switch input:radio').on 'change', (e)->
    collection.setConfig 'iconStyle', this.value
    return

  # get ext data, should contain a version number
  getExtData = ->
    console.log '[todo]...'

  # back data
  $('#backup-ext-data').on 'click', ->
    text = encodeURIComponent JSON.stringify do getExtData
    dom = document.createElement 'a'
    dom.setAttribute 'href', 'data:text/plain;charset=utf-8,' + text
    dom.setAttribute 'download', 'my-webrequest-data-backup.json'
    dom.click()

  $('#restore-ext-data').on 'click', ->


  return {
    init: init
  }