# data backup and restore
define (require)->
  collection = require 'common/js/collection'
  # data version
  version = '0.1'

  # get localStorage data into an object
  getExtData = ->
    ret = {}
    for own k, v of localStorage
      ret[ k ] = v
    ret
    
  # restore json string or object to localStorage
  restoreExtData = (data)->
    if typeof data isnt 'object'
      try
        data = JSON.parse data
      catch e
        return false
    for k, v of data
      localStorage.setItem k, if typeof v is 'string' then v else String v
    # reinit collection data in options page
    collection.initCollection()
    true
    
      
  ###*
   * save text into file
   * @param  {String|Object} text     content of the file
   * @param  {String} filename filename
  ###
  save2File = (text, filename)->
    if typeof text is 'object'
      text = JSON.stringify text
    else
      text = "#{text}"
    text = encodeURIComponent text
    dom = document.createElement 'a'
    dom.setAttribute 'href', 'data:text/plain;charset=utf-8,' + text
    dom.setAttribute 'download', filename
    dom.click()

  # f = e.target.files[0]
  readFile = (f, done, fail)->
    size = f.size
    # file size bigger than 5mb
    if size > 1024 * 1024 * 5
      alert 'Are you kidding me? the config file is bigger than 5m!'
      fail 'SIZE_OVERFLOW'
      return
    
    reader = new FileReader()
    reader.onload = (e)->
      done e.target.result
    reader.onerror = (e)->
      fail e.message

    reader.readAsText f


  return {
    readFile       : readFile
    getExtData     : getExtData
    restoreExtData : restoreExtData
    save2File      : save2File
  }
