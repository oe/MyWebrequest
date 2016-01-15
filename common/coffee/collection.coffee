###*
 * all rules gather together to be a collection
###
((root, factory)->
  if typeof define is 'function' and (define.amd or define.cmd)
    define ->
      factory root
  else if typeof exports is 'object'
    module.exports = factory root
  else
    root.collection = factory root
  return
)(this, (root) ->
  # utils = require 'js/utils'
  # rules' collection
  collection = {}
  # categories
  cats = ['block', 'hsts', 'hotlink', 'log', 'custom', 'gsearch']

  # init rules into collection from localStorage
  initCollection = ->
    for cat in cats
      hasInvalidRule = false
      if cat is 'custom'
        rules = JSON.parse localStorage.getItem( cat ) or '{}'
        # clear invalid rule
        for k, v of rules
          unless v
            hasInvalidRule = true
            delete rules[ k ]
        collection[cat] = rules
      else
        rules = JSON.parse localStorage.getItem( cat ) or '[]'
        # clear invalid rule
        collection[cat] = rules.filter (rule)-> !!rule
        hasInvalidRule = collection[cat].length isnt rules.length
      
      if hasInvalidRule then localStorage.setItem cat, JSON.stringify rules
    return

  hasCat = (cat)->
    ~cats.indexOf cat

  # get rules
  getRules = (cat)->
    rules = collection[ cat ]
    if cat is 'custom'
      Object.keys rules
    else
      rules

  # get a single rule for show
  getRule4Show = (cat, rule)->
    if cat is 'custom'
      {
        ruleId: rule.url
        rule: "<div>#{rule.matchUrl}</div><div>#{rule.redirectUrl}</div>"
        title: ''
        cls: 'cs-cell'
      }
    else
      {
        ruleId: rule
        rule: rule
        title: rule
      }
  # get a list for show
  getRules4Show = (cat)->
    rules = collection[ cat ]
    if cat is 'custom'
      ret = []
      for k, v of rules
        ret.push
          ruleId: v.url
          rule: "<div>#{v.matchUrl}</div><div>#{v.redirectUrl}</div>"
          title: ''
          cls: 'cs-cell'
      ret
    else
      rules.map (rule)->
        {
          ruleId: rule
          rule: rule
          title: rule
        }
    

  # get the index of a rule
  # -1 means not found
  hasRule = (cat, rule)->
    rules = collection[ cat ]
    return false unless rules
    if cat is 'custom'
      !!rules[ rule.url ]
    else
      rule in rules

  # add a rule
  addRule = (cat, rule)->
    return false if not rule or hasRule cat, rule
    rules = collection[ cat ]
    if cat is 'custom'
      rules[ rule.url ] = rule
    else
      rules.push rule

    saveRule cat
    return true

  # remove rules
  # if rule is undefined then empty all the rules
  removeRule = (cat, rules)->
    _rules = getRules cat
    if rules is undefined or (Array.isArray(rules) and _rules.length is rules.length)
      collection[ cat ] = null
      # disable feature of cat when empty
      # TODO: should it be done in background js?
      # utils.setSwitch cat, false
    else
      rules = [ rules ] unless Array.isArray rules
      rules.forEach (rule)->
        if cat is 'custom'
          delete collection[ cat ][ rule ]
        else
          index = _rules.indexOf rule
          _rules.splice index, 1
        return
    saveRule cat
    return

  # set restore status
  # if flag true, then add status flag, or remove it
  setRestoreStatus = (flag)->
    if flag
      localStorage.setItem '_is_restoring_', 'processing'
    else
      localStorage.removeItem '_is_restoring_'

  # whether if restoring
  isRestoring = ->
    !!localStorage.getItem '_is_restoring_'

  # save rules into localStorage
  saveRule = (cat)->
    rules = collection[ cat ]
    if rules
      localStorage.setItem cat, JSON.stringify rules
    else
      localStorage.removeItem cat

    do initCollection
    return


  # loop in rules
  eachRule = (cat, fn, context)->
    rules = collection[ cat ]
    return unless rules
    rules.forEach (rule)->
      if rule isnt undefined
        fn.call context, rule
      return
    return

  # get the switch of cat whether has turned on
  getSwitch = (cat)->
    onoff = JSON.parse localStorage.getItem('onoff') or '{}'
    !!onoff[ cat ]

  # set switch of cat to isOn
  setSwitch = (cat, isOn)->
    onoff = JSON.parse localStorage.getItem('onoff') or '{}'
    onoff[ cat ] = !!isOn
    localStorage.setItem 'onoff', JSON.stringify onoff
    return

  # get the config of {key}
  getConfig = (key)->
    config = JSON.parse localStorage.getItem('config') or '{}'
    config[ key ]

  # set the config of {key}
  setConfig = (key, val)->
    config = JSON.parse localStorage.getItem('config') or '{}'
    config[ key ] = val
    localStorage.setItem 'config', JSON.stringify config
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

  # set a data
  setLocal = (key, val)->
    localStorage.setItem key, JSON.stringify val
    do initCollection
    return

  # remove a data
  removeLocal = (key)->
    localStorage.removeItem key
    do initCollection
    return

  # init collection
  do initCollection

  return {
    _collection      : collection
    initCollection   : initCollection
    setRestoreStatus : setRestoreStatus
    isRestoring      : isRestoring
    hasCat           : hasCat
    addRule          : addRule
    getRules         : getRules
    getRules4Show    : getRules4Show
    getRule4Show     : getRule4Show
    removeRule       : removeRule
    saveRule         : saveRule
    eachRule         : eachRule
    getLocal         : getLocal
    setLocal         : setLocal
    getSwitch        : getSwitch
    setSwitch        : setSwitch
    getConfig        : getConfig
    setConfig        : setConfig
  }
)
