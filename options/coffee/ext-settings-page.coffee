define (require)->
  collection = require 'common/js/collection'
  dataMaintain = require 'js/data-maintain'
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


  # back data
  $('#backup-ext-data').on 'click', ->
    text = encodeURIComponent JSON.stringify do dataMaintain.getExtData
    dom = document.createElement 'a'
    dom.setAttribute 'href', 'data:text/plain;charset=utf-8,' + text
    dom.setAttribute 'download', 'demo.json'
    dom.click()

  $('#restore-ext-data').on 'change', (e)->
    files = e.target.files
    console.log files
    if files.length
      dataMaintain.readFile files[0]
    


  return {
    init: init
  }