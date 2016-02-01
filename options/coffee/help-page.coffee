define (require)->

  init = (cat, parts)->
    if parts
      $('html, body').animate
        scrollTop: $("##{parts}").offset().top - 70
      , 500
    
    return
    


  return {
    init: init
  }