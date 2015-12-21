# data backup and restore
define (require)->
  # data version
  version = '0.1'

  getExtData = ->


  restoreExtData = ->

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
  readFile = (f)->
    size = f.size
    # file size bigger than 5mb
    if size > 1024 * 1024 * 5
      alert 'Are you kidding me? the config file is bigger than 5m!'
      return
    
    reader = new FileReader()
    reader.onload = (e)->
      content = e.target.result
      console.log "file: #{content}"
      console.log JSON.parse content
    reader.readAsText f


  return {
    readFile       : readFile
    getExtData     : getExtData
    restoreExtData : restoreExtData
    save2File      : save2File
  }
