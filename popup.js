import $ from 'jquery'
$(() => {
  helper.hello()

  function generateQrCode(content) {
    $('#qrcode').html('').qrcode({
      width: 250,
      height: 250,
      text: content
    })
  }

  function makeQRCode() {
    $('#prompt').html(chrome.i18n.getMessage('pop_get_new'))
    let text = $('#text').val().trim()
    const $textWrapper = $('#text-wrapper')
    const $tooLong = $('#long-error')

    if (text.length > 400) {
      $textWrapper.addClass('error')
      $tooLong.prop('hidden', false)
      setTimeout(() => {
        $textWrapper.removeClass('error')
        $tooLong.prop('hidden', true)
      }, 3000)
      return
    }

    generateQrCode(text)
    $textWrapper.removeClass('focus')
    $('#qrcode-wrapper').show().focus()
    $('#ntwk-error').prop('hidden', true)

    $('#action-tip').text(chrome.i18n.getMessage('pop_action_tip'))
  }

  const $count = $('#letter-cunt')
  $('#text').on('keydown', (e) => {
    if( (e.ctrlKey || e.metaKey) && e.keyCode === 13) makeQRCode()
  }).on('change', () => {
    $count.text(`${this.value.trim().length}/300`)
  })

  $('#make').on('click', makeQRCode)

  $('#qrcode-wrapper').on('dblclick', function (){
    $(this).hide()
    $('#prompt').text(chrome.i18n.getMessage('pop_edit_promp'))
    $('#action-tip').text(chrome.i18n.getMessage('pop_edit_tip'))
    $('#text-wrapper').addClass('focus')
    $('#text').select().focus()
  })

  function init() {
    chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    }, (tabs) => {
      const content = tabs[0].url
      $('#text').val(content)
      generateQrCode(content)
    })
  }

  init()
})
