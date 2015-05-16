define ->
  dialogOKCB = null
  showDlg = (config)->
    $overlayWrapper = $ '#confirm-dialog-wrapper'
    $dlgTitle = $ '#dialog-title'
    $dlgContent = $ '#dialog-content'
    $dlgOKBtn = $ '#dialog-ok-btn'
    $dlgCancelBtn = $ '#dialog-cancel-btn'
    config = config || {}

    $(document.body).addClass 'ovHidden'
    $overlayWrapper.prop 'hidden', false
    $overlayWrapper.addClass 'fadeInDown'

    $dlgTitle.text config.title or 'No title'
    $dlgContent.html config.content or 'No content'
    $dlgOKBtn.prop 'hidden', !!config.hideOK
    $dlgCancelBtn.prop 'hidden', !!config.hideCancel

    if $.isFunction config.callback
      dialogOKCB = config.callback
      dialogOKCB.args = if config.cbargs then config.cbargs else []
      $dlgOKBtn.removeClass 'cancel'
    else
      dialogOKCB = null

    if $.isNumeric(config.timeout) and config.timeout > 0
      setTimeout hideDialog, config.timeout

    if config.focusOnOK
      $dlgOKBtn.focus()
    else
      $dlgCancelBtn.focus()

  $('#dialog-ok-btn').on 'click', (e)->
    hideDlg '#confirm-dialog-wrapper'
    if dialogOKCB
      dialogOKCB.apply null, dialogOKCB.args
      dialogOKCB.args = null
      dialogOKCB = null

  hideDlg = (dlgWrapper)->
    $overlayWrapper = $ dlgWrapper
    $overlayWrapper.removeClass 'fadeInDown'
    $overlayWrapper.addClass 'fadeOutUp'
    setTimeout ()->
      $overlayWrapper.removeClass 'fadeOutUp'
      $overlayWrapper.prop 'hidden', true
      $(document.body).removeClass 'ovHidden'
    , 220
    return

  # dialog cancel btn click
  $('.dialog').on 'click', '.cancel', hideDlg
  # //show error tip
  showTip = (el, msg)->
    $el = $ el
    $tooltip = $ '#tooltip'
    $msg = $ '#tooltip-msg'
    pos = $el.offset()
    $msg.html msg
    pos.top += $el.height() + 15
    pos.left += $el.width() / 2 - $tooltip.width() / 2
    $tooltip.css {
      top: pos.top + 'px',
      left: pos.left + 'px'
    }
    setTimeout ->
      $tooltip.addClass 'show'
      return
    , 10
      
    $el.focus().select()
    return
  return {
    hideDlg: hideDlg
    showDlg: showDlg
    showTip: showTip
  }