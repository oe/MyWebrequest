define (require)->
  collection = require 'common/js/collection'
  dataMaintain = require 'js/data-maintain'
  utils = require 'common/js/utils'
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

  # show error message
  showErrorInfo = (msg)->
    dialog
      title: utils.i18n 'opt_errdlg_title'
      content: msg
      okValue: utils.i18n 'ok_btn'
      ok: ->
    .showModal()

  # choose a file to read
  $('#restore-ext-data').on 'change', (e)->
    files = e.target.files
    me = this
    if files.length
      dialog
        title: utils.i18n 'opt_errdlg_title'
        content: utils.i18n 'opt_restore_confirmtip'
        okValue: utils.i18n 'ok_btn'
        cancelValue: utils.i18n 'cancel_btn'
        cancel: ->
          # clear selected files
          # to trigger change event after choose file again
          me.value = ''
        ok: ->
          dataMaintain.readFile files[0], (content)->
            me.value = ''
            unless dataMaintain.restoreExtData content
              showErrorInfo utils.i18n 'opt_restore_formarterr'
              return
            # reinit this page because it can be affected
            setTimeout ->
              init()
            , 300
            dialog
              content: utils.i18n 'opt_restore_success'
              width: 250
            .show $(me).parents('a')[0]
          , (msg)->
            me.value = ''
            showErrorInfo utils.i18n('opt_restore_readfail') + ': ' + msg
      .showModal()



    


  return {
    init: init
  }