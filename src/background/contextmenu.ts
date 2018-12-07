import collection from '@/common/collection'
import { pushNotification } from '@/common/utils'
import { isRuleEnabled } from '@/background/utils'
// @ts-ignore
import TurndownService from 'turndown'
import { IMenuConfig, IMenuConfigs, EMenuAction } from '@/types/contextmenu'


let turndownService: TurndownService

interface ICacheItem {
  id: string,
  action: EMenuAction
  content: string
}

let cachedRules: ICacheItem[] = []

const ALL_URL_PTTRNS = ['*://*/*', 'file://*/*', 'ftp://*/*']

type IMenuActions = {
  [k in EMenuAction]: (content: string, tab: chrome.tabs.Tab) => void
}
const menuActions: IMenuActions = {
  [EMenuAction.GEN_QRCODE] (content, tab) {
    const data = { content }
    chrome.storage.local.set({ 'qr-menu': data })
    console.log('qr-menu', data)
    chrome.tabs.executeScript(tab.id!, {
      file: '/content-scripts/qr.js',
      // execute js ASAP, make QR feature available even before page loaded
      runAt: 'document_start'
    })
  },
  [EMenuAction.OPEN_SCHEME] (content) {
    chrome.tabs.create({ url: content }, () => {
      if (chrome.runtime.lastError) {
        console.warn(
          `[menu-openScheme] failed to open ${content}`,
          chrome.runtime.lastError
        )
      }
    })
  },
  [EMenuAction.CONVERT2MD] (content) {
    if (!turndownService) {
      turndownService = new TurndownService({
        headingStyle: 'atx',
        hr: '---',
        codeBlockStyle: 'fenced'
      })
    }
    const markdown = turndownService.turndown(content)
    console.log('markdown content', markdown)
    copyText(markdown)
    pushNotification({
      title: 'Copy success',
      content: markdown.slice(0, 200),
      timeout: 2000
    })
  },
  [EMenuAction.COPY] (content) {
    copyText(content)
    pushNotification({
      title: 'Copy success',
      content: content.slice(0, 200),
      timeout: 2000
    })
  }
}

function copyText (content: string) {
  document.oncopy = function (event) {
    event.clipboardData.setData('text/plain', content)
    event.preventDefault()
  }
  document.execCommand('copy', false)
}

// update cache
function updateCache (menus?: IMenuConfigs) {
  if (menus) {
    cachedRules = menus.map(item => ({
      id: item.id,
      action: item.action,
      content: item.content
    }))
  } else {
    cachedRules = []
  }
}

// remove all context menu
function removeAll () {
  console.warn('remove menu')
  chrome.contextMenus.removeAll()
}


function addMenu (item: chrome.contextMenus.CreateProperties) {
  chrome.contextMenus.create(item)
}


function normalizeMenuConfig (item: IMenuConfig, withoutID?: boolean): chrome.contextMenus.CreateProperties {
  const documentUrlPatterns =
    item.documentUrlPatterns === 'all_urls'
      ? ALL_URL_PTTRNS
      : item.documentUrlPatterns
        ? Array.isArray(item.documentUrlPatterns)
          ? item.documentUrlPatterns
          : [item.documentUrlPatterns]
        : []

  const targetUrlPatterns = item.targetUrlPatterns
    ? Array.isArray(item.targetUrlPatterns)
      ? item.targetUrlPatterns
      : [item.targetUrlPatterns]
    : []

  const config: chrome.contextMenus.CreateProperties = {
    title: item.title,
    type: 'normal',
    contexts: item.contexts
  }
  if (documentUrlPatterns) {
    config.documentUrlPatterns = documentUrlPatterns
  }
  if (targetUrlPatterns) {
    config.targetUrlPatterns = targetUrlPatterns
  }
  if (withoutID !== true) config.id = item.id
  return config
}


async function getRule () {
  const result = await collection.get('contextmenu') as IMenuConfigs
  if (result && result.length) {
    // ignore disabled
    const menus = result.filter(isRuleEnabled)
    updateCache(menus)
    return menus.map((item) => normalizeMenuConfig(item))
  }
  return []
}

export async function toggle (isOn: boolean) {
  console.log('contextmenu.js isOn', isOn)
  // @ts-ignore
  chrome.contextMenus.onClicked.removeListener(onMenuClick)
  if (isOn) {
    const menuItems = await getRule()
    console.log('menu items', menuItems)
    if (!menuItems || !menuItems.length) return
    menuItems.forEach(addMenu)
    // @ts-ignore
    chrome.contextMenus.onClicked.addListener(onMenuClick)
  } else {
    updateCache()
    removeAll()
  }
}

async function getPageInfo (tab: chrome.tabs.Tab) {
  console.log('get page info', tab)
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(
      tab.id!,
      {
        file: '/content-scripts/page-excerpt.js',
        // execute js ASAP, make QR feature available even before page loaded
        runAt: 'document_start'
      },
      () => {
        if (chrome.runtime.lastError) return reject(chrome.runtime.lastError)
        chrome.tabs.sendMessage(tab.id!, { cmd: 'get-excerpt' }, resolve)
      }
    )
  })
}

async function getParams (tab: chrome.tabs.Tab, info: chrome.contextMenus.OnClickData, pattern: string) {
  const result = {
    pageUrl: tab.url,
    pageTitle: tab.title,
    favIconUrl: tab.favIconUrl,
    selectedText: info.selectionText || '',
    linkUrl: info.linkUrl,
    srcUrl: info.srcUrl,
    selectedLink: info.linkUrl || info.srcUrl
  }
  let pageInfo = {}
  if (isNeedPageInfo(pattern)) {
    pageInfo = await getPageInfo(tab)
  }

  if (pattern.indexOf('{selectedText}') !== -1) {
    result.selectedText = await getSeletedTextWithNL()
  }

  return Object.assign(result, pageInfo)
}

// get selected text with new line
function getSeletedTextWithNL () {
  return new Promise<string>(resolve => {
    chrome.tabs.executeScript(
      {
        code: 'window.getSelection().toString();'
      },
      function (selection) {
        console.log('selection from code', selection)
        // selected contains text including line breaks
        resolve(selection[0])
      }
    )
  })
}

const PAGE_VAR_NAME = [
  'selectedHtml',
  'pageText',
  'pageHtml',
  'articleHtml',
  'articleText'
]

function isNeedPageInfo (contentPattern: string) {
  let count = 0
  contentPattern.replace(/\{(\w+)\}/g, ($0: string, $1: string) => {
    if (PAGE_VAR_NAME.includes($1))++count
    return ''
  })
  return !!count
}

async function getContent (contentPattern: string, info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) {
  console.warn('getContent', ...arguments)
  if (!/\{\w+\}/.test(contentPattern)) return contentPattern
  const params = await getParams(tab, info, contentPattern)
  console.warn('getContent params', params)
  return contentPattern.replace(/\{(\w+)\}/g, ($0, $1) => {
    // @ts-ignore
    return params[$1] || $1
  })
}

async function onMenuClick (info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) {
  const matched = cachedRules.find(item => item.id === info.menuItemId)
  if (!matched) {
    console.warn('[menu-onMenuClick] can not find rule for', info)
    return
  }
  const menuAction = menuActions[matched.action]
  if (!menuAction) {
    console.warn('[menu-onMenuClick] can not find menuAction for', matched)
    return
  }
  const content = await getContent(matched.content, info, tab)
  menuAction(content, tab)
}

