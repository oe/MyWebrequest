((root, factory)->
  if typeof define is 'function' and (define.amd or define.cmd)
    define ->
      factory root
  else if typeof exports is 'object'
    module.exports = factory root
  else
    root.utils = factory root
  return
)(this, (root) ->

  # if an object contains a value
  isValueInObj = (obj, val)->
    for own k, v of obj
      return true if v is val
    false

  # check an ip addr. eg. 102.33.22.1
  ipReg = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])$/
  isValidIp = (ip)->
    ipReg.test ip

  # check a host. eg. google.com, dev.fb.com, etc.
  hostReg = /^(\*((\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,4})?|([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,4})$/
  isValidHost = (host)->
    hostReg.test host

  # check a path. eg. path/subpath/file.html?querystring
  pathReg = /^[a-z0-9-_\+=&%@!\.,\*\?\|~\/]+$/i
  isValidPath = (path)->
    pathReg.test path


  # get the switch of cat whether has turned on
  getSwitch = (cat)->
    onoff = JSON.parse localStorage.getItem('onoff') or '{}'
    !!onoff[ cat ]
  # set switch of cat to isOn
  setSwitch = (cat, isOn)->
    onoff = JSON.parse localStorage.getItem('onoff') or '{}'
    onoff[ cat ] = !!isOn
    return

  # get data from localStorage
  getLocal = (key, expectFormat)->
    switch expectFormat
      when 'object', 'o'
        JSON.parse localStorage.getItem( key ) or '{}'
      when 'array', 'a'
        JSON.parse localStorage.getItem( key ) or '[]'
      else
        localStorage.getItem key


  return {
    isValueInObj   : isValueInObj
    isIp           : isValidIp
    isHost         : isValidHost
    isPath         : isValidPath
    getLocal       : getLocal
    getSwitch      : getSwitch
    setSwitch      : setSwitch
  }
)