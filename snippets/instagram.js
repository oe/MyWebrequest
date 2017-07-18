/**
 * enable instagram image drag
 */
;(function () {
  function insertStyle() {
    const styleText = `
    ._ovg3g {
      display: none !important;
    }
    `
    const style = document.createElement('style')
    style.textContent = styleText
    document.head.insertAdjacentElement('beforeend', style)
  }

  function enableDrag() {
    document.addEventListener('mousedown', function (e) {
      if (e.target.tagName === 'IMG') e.stopPropagation()
    }, true)
  }
  insertStyle()
  enableDrag()
})();


