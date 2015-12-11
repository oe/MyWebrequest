define (require)->
  utils = require 'common/utils'
  iconStyles = [ 'colored', 'grey' ]
  init = ->
    iconStyle = utils.getConfig 'iconStyle'
    iconStyle = 'colored' if -1 is iconStyles.indexOf iconStyle
    $("#ext-iconstyle-switch input[value='#{iconStyle}']").prop 'checked', true
    return

  # 浏览器ext图标
  $('#ext-iconstyle-switch input:radio').on 'change', (e)->
    utils.setConfig 'iconStyle', this.value
    return


  return {
    init: init
  }