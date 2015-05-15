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
  cats= ['block', 'hsts', 'hotlink', 'log']

  hasCat = (cat)->
    ~cats.indexOf cat

  # remove undefined rule
  getRules = (cat)->
    rules = collection[ cat ]
    rules.filter (rule)->
      rule isnt undefined

  # init rules into collection from localStorage
  initCollection = ->
    cats= ['block', 'hsts', 'hotlink', 'log']

    for cat in cats
      collection[cat] = JSON.parse localStorage.getItem( cat ) or '[]'

    return

  # get the index of a rule
  # -1 means not found
  indexOfRule = (cat, rule)->
    rules = collection[ cat ]
    return -1 unless rules and rule

    rules.indexOf rule

  # add a rule
  addRule = (cat, rule)->
    return false if not rule or ~indexOfRule cat, rule
    rules = collection[cat]
    rules[ rules.length++ ] = rule

    saveRule cat
    return true

  # remove a rule
  # if rule is undefined then empty all the rules
  removeRule = (cat, rules)->
    _rules = getRules cat
    if rule is undefined or (Array.isArray(rules) and _rules.length is rules.length)
      collection[ cat ] = []
      # disable feature of cat when empty
      # TODO: should it be done in background js?
      # utils.setSwitch cat, false
    else
      rules = [ rules ] unless Array.isArray rules
      rules.forEach (rule)->
        index = indexOfRule cat, rule
        _rules[ index ] = undefined if ~index
        return
    saveRule cat
    return

  # save rules into localStorage
  saveRule = (cat)->
    arr = getRules cat
    localStorage.setItem cat, JSON.stringify arr
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

  # init collection
  do initCollection

  return {
    _collection : collection
    indexOfRule : indexOfRule
    hasCat      : hasCat
    addRule     : addRule
    getRules    : getRules
    removeRule  : removeRule
    saveRule    : saveRule
    eachRule    : eachRule
  }
)
