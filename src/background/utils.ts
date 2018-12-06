/**
 * remove headers with names
 * @param  {Array} headers headers
 * @param  {Array|String} names   names to remove
 * @return {Array}
 */
export function removeHeaders(headers: chrome.webRequest.HttpHeader[], names: string | string[]) {
  let isInNames: Function
  if (Array.isArray(names)) {
    isInNames = (name: string) => names.includes(name)
  } else {
    isInNames = (name: string) => names === name
  }
  let len = headers.length
  while (len--) {
    if (isInNames(headers[len].name)) {
      headers.splice(len, 1)
    }
  }
}