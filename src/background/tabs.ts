export interface ITabChangeEvent {
  type: 'updated' | 'created',
  tabId: number
  url: string
}

export interface ITabRemoveEvet {
  type: 'removed',
  tabId: number
}

export type ITabEvent = ITabChangeEvent | ITabRemoveEvet

type ITabListener = (evt: ITabEvent) => void

let IS_LISTENER_STARTED = false
const EVT_CBS: ITabListener[] = []
export function addTabListener (cb: ITabListener) {
  if (EVT_CBS.includes(cb)) {
    console.warn('duplicated listener')
    return
  }
  EVT_CBS.push(cb)
  if (!IS_LISTENER_STARTED) toggleListener(true)
}

export function removeTabListener (cb: ITabListener) {
  const idx = EVT_CBS.indexOf(cb)
  if (idx === -1) {
    console.warn('listener not exist')
    return
  }
  EVT_CBS.splice(idx, 1)
  if (!EVT_CBS.length) toggleListener(true)
}

function toggleListener (isOn: boolean) {
  const method = isOn ? 'addListener' : 'removeListener'
  chrome.tabs.onCreated[method](onTabCreated)
  chrome.tabs.onUpdated[method](onTabUpdate)
  chrome.tabs.onRemoved[method](onTabRemoved)
  IS_LISTENER_STARTED = isOn
  if (isOn) {
    chrome.tabs.query({ discarded: false }, tabs => {
      tabs.forEach(tab => onTabCreated(tab))
    })
  }
}

function runListener (evt: ITabEvent) {
  EVT_CBS.forEach((cb) => cb(evt))
}

function onTabCreated (tab: chrome.tabs.Tab) {
  if (!tab.id || tab.id < 0 || !tab.url) return
  const evt: ITabChangeEvent = {
    type: 'created',
    tabId: tab.id,
    url: tab.url
  }
  runListener(evt)
}

function onTabUpdate (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
  // ignore tab been discarded
  if (changeInfo.discarded || !changeInfo.url || !tabId || tabId < 0) return
  const evt: ITabChangeEvent = {
    type: 'updated',
    tabId: tabId,
    url: changeInfo.url
  }
  runListener(evt)
}

function onTabRemoved (tabId: number) {
  if (!tabId || tabId < 0) return
  const evt: ITabRemoveEvet = {
    type: 'removed',
    tabId: tabId
  }
  runListener(evt)
}
