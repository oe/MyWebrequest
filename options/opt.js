;(function  () {
	//auto i18n
	(function () {
		var eles = document.querySelectorAll('[i18n-content]'),
			eles = Array.prototype.slice.call(eles);
		eles.forEach(function (ele) {
			ele.innerHTML = chrome.i18n.getMessage(ele.getAttribute('i18n-content')) || 'Error:No Message';
		});
	})();

})();
