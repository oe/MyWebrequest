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
  if (sel.rangeCount) {
    const container = document.createElement('div')
    for (let i = 0, len = sel.rangeCount; i < len; ++i) {
      container.appendChild(sel.getRangeAt(i).cloneContents())
    }
    html = container.innerHTML
  }
  return html
}

function getExcerpt () {
  const article = new Readability(document).parse()
  const container = document.createElement('div')
  container.innerHTML = article.content
  return {
    articleHtml: article.content,
    articleText: container.innerText
  }
}

function getAll () {
  return Object.assign(getExcerpt(), getSelectedHtml(), getPageBody())
}

function main () {
  if (window.__getPageAll__) {
    return window.__getPageAll__()
  }
  window.__getPageAll__ = getAll
  return getAll()
}

/* eslint no-undef: "off" */
result = main()
