/** remvoe referrer when open a new a url */
(function main () {
  let refer = document.querySelector('meta[name="referrer"]')
  if (!refer) {
    refer = document.createElement('meta')
    refer.setAttribute('name', 'referrer')
    document.head!.appendChild(refer)
  }
  const content = refer.getAttribute('content') || ''
  const allowed = ['no-referrer', 'same-origin']
  if (allowed.includes(content)) return
  refer.setAttribute('content', 'same-origin')
})()