/** transform object keys to number array */
function key2numbers (tabs: ITabCache) {
  return Object.keys(tabs).map(id => parseInt(id, 10))
}

// cache data for frequently usage
interface ICacheRule {
  reg: RegExp
  [k: string]: any
}

interface ITabCache {
  [k: number]: any
}

interface ICreateTabCacheOptions {
  /** tab been deleted/created */
  onTabChanged?: (newTabIds: number[], oldTabIds: number[]) => void
  /** existing tab updated */
  onTabUpdated?: (tabId: number) => void
  /** is the tab match the rule */
  getTabMatchedRule: (tab: chrome.tabs.Tab) => (undefined | ICacheRule)
}

export function creatTabCache ({ onTabChanged, onTabUpdated, getTabMatchedRule }: ICreateTabCacheOptions) {


  let tabCache: ITabCache = {}

  let isListenerStarted = false


  function removeTabCache (id: number) {
    const oldTabIds = key2numbers(tabCache)
    delete tabCache[id]
    onTabChanged && onTabChanged(key2numbers(tabCache), oldTabIds)
  }

  function addTabCache (id: number, data: ICacheRule) {
    const isNewTab = !tabCache[id]
    const oldTabIds = key2numbers(tabCache)
    tabCache[id] = data
    if (isNewTab) {
      onTabChanged && onTabChanged(key2numbers(tabCache), oldTabIds)
    } else {
      onTabUpdated && onTabUpdated(id)
    }
  }

  const onTabUpdate = function (
    tabId: chrome.tabs.Tab | number,
    changeInfo?: chrome.tabs.TabChangeInfo,
    tab?: chrome.tabs.Tab) {

    if (!tab) tab = tabId as chrome.tabs.Tab
    // ignore tab been discarded
    if (changeInfo && changeInfo.discarded) return
    const url = tab.url
    if (!url || !/^(https?|file|ftp)/.test(url) || !tab.id || tab.id < 1) return removeTabCache(tab.id || 0)
    const matched = getTabMatchedRule(tab)
    if (!matched) return removeTabCache(tab.id)
    addTabCache(tab.id, matched)
  }

  function toggleTabListener (isOn?: boolean) {
    const method = isOn ? 'addListener' : 'removeListener'
    chrome.tabs.onCreated[method](onTabUpdate)
    chrome.tabs.onUpdated[method](onTabUpdate)
    isListenerStarted = !!isOn
    if (isOn) {
      chrome.tabs.query({ discarded: false }, tabs => {
        tabs.forEach(tab => onTabUpdate(tab))
      })
    } else {
      tabCache = {}
    }
  }

  return {
    toggleTabListener,
    get tabCache () {
      return tabCache
    },
    get isListenerStarted () {
      return isListenerStarted
    }
  }
}