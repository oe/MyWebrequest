// @ts-ignore
import Readability from './readability'

function getPageBody () {
  return {
    pageHtml: document.body.innerHTML,
    pageText: document.body.innerText
  }
}

function getSelectedHtml () {
  const sel = window.getSelection()
  let html = ''
  if (!sel) return html
  if (sel.rangeCount) {
    const container = document.createElement('div')
    const count = sel.rangeCount
    for (let i = 0; i < count; ++i) {
      container.appendChild(sel.getRangeAt(i).cloneContents())
    }
    html = container.innerHTML
  }
  return html
}

function getExcerpt () {
  const documentClone = document.cloneNode(true)
  // @ts-ignore
  const article = new Readability(documentClone).parse()!
  const container = document.createElement('div')
  container.innerHTML = article.content
  return {
    articleHtml: article.content,
    articleText: container.innerText
  }
}

function getAll () {
  return Object.assign(getExcerpt(), getPageBody(), {
    selectedHtml: getSelectedHtml()
  })
}

function main () {
  // @ts-ignore
  if (window.__is_page_excerpt_inited__) {
    return
  }
  // @ts-ignore
  window.__is_page_excerpt_inited__ = true
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.cmd === 'get-excerpt') {
      sendResponse(getAll())
    }
  })
}

main()
