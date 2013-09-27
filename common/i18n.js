;(function  () {
	//auto i18n
	(function () {
		//i18n html content
		var eles = document.querySelectorAll('[i18n-content]'),
			attr = '',
			eles = Array.prototype.slice.call(eles);
		eles.forEach(function (ele) {
			ele.innerHTML = chrome.i18n.getMessage(ele.getAttribute('i18n-content')) || 'Error:No Message';
		});

		// i18n node attribute
		eles = document.querySelectorAll('[i18n-value]');
		eles = Array.prototype.slice.call(eles);
		eles.forEach(function (ele) {
			attr = ele.getAttribute('i18n-value');
			ele.setAttribute(attr,chrome.i18n.getMessage(attr) || 'Error:No values');
		});
	})();

})();
