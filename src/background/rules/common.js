import clonedeep from 'lodash.clonedeep'
import debounce from 'lodash.debounce'
import collection from '@/common/collection'

/**
 * is a rule valid
 * @param {Object} item rule object
 */
export function isRuleEnabled(item) {
  return item.enabled && item.valid
}

export default class RuleProcessor {
  constructor(name, options, notWebRequest) {
    this.name = name
    this.enabled = false
    this.isWebRequest = !notWebRequest
    if (this.isWebRequest) {
      this._defaultRules = options.defaultRules || { urls: [] }
      this._webrequests = options.webrequests
    }
    if (options.toggle) this._toggle = options.toggle
    if (options.onChange) this._onChange = options.onChange
  }
  // get webrequest rule object by rule type
  async _getRule() {
    // clone Depp to avoid urls duplication
    const rule = clonedeep(this._defaultRules)
    if (!rule) {
      console.warn('cant find rules of', this.name)
      return
    }
    let urls = await collection.get(this.name)
    // ignore disabled
    urls = urls.filter(isRuleEnabled).map(itm => itm.url)
    rule.urls.push(...urls)
    console.warn(`all rules of ${this.name}`, rule.urls)
    // return rule of has urls
    return rule.urls.length && rule
  }

  async toggle(isOn) {
    if (this.enabled === isOn) return
    if (this._toggle) {
      this._toggle(isOn)
    } else if (this.isWebRequest) {
      const rule = await this._getRule()
      // return false if set to on but no rule available
      if (isOn && !rule) return false
      this._toggleWebRequest(rule, isOn)
      this.enabled = isOn
    } else {
      throw new Error(`unsupported rule ${this.name}`)
    }
  }

  _toggleWebRequest(rule, isOn) {
    const webrequests = this._webrequests
    // if (ruleConfig.updateConfig) await ruleConfig.updateConfig(isOn)
    const len = webrequests.length
    for (let i = 0; i < len; i++) {
      const requestConfig = webrequests[i]
      const action = isOn ? 'addListener' : 'removeListener'
      // if (!isOn && requestConfig.cache) requestConfig.cache = null
      chrome.webRequest[requestConfig.on][action](
        requestConfig.fn,
        rule,
        requestConfig.permit
      )
    }
    this._forceWebrequestReload()
  }

  async onChange(newVal, oldVal) {
    if (!this.enabled) return
    if (this._onChange) {
      this._onChange(newVal, oldVal)
    } else if (this.isWebRequest) {
      const rule = await this._getRule()
      await this._toggleWebRequest(rule, false)
      // if no rule, just turn off
      if (!rule) {
        await collection.setOnoff(this.name, false)
      } else {
        await this._toggleWebRequest(rule, true)
      }
      this._forceWebrequestReload()
    }
  }
  // force webrequest to reload, make all changes take effects immediately
  _forceWebrequestReload = debounce(function() {
    chrome.webRequest.handlerBehaviorChanged()
  }, 100)
}
