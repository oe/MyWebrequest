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

  # get current date string
  getNowDate = ->
    now = new Date
    now.getFullYear() + '-' + ( now.getMonth() + 1 ) + '-' + now.getDate()


  # back data
  $('#backup-ext-data').on 'click', ->
    extData = dataMaintain.getExtData()
    dataMaintain.save2File extData, "my-webrequest-#{getNowDate()}.json"

  # choose a file to read
  $('#restore-ext-data').on 'change', (e)->
    files = e.target.files
    if files.length
      # set a flag to tell localStorage the change if from restoration
      collection.setRestoreStatus true
      dataMaintain.readFile files[0], (content)->
        unless dataMaintain.restoreExtData content
          collection.setRestoreStatus false
          alert 'format error!'
          return
        # reinit this page because it can be affected
        setTimeout ->
          init()
        , 300
      , (msg)->
        alert msg

    


  return {
    init: init
  }