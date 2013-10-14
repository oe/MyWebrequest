;(function  () {
	//auto i18n
	(function () {
		//i18n html content
		var eles = document.querySelectorAll('[i18n-content]');

		eles = Array.prototype.slice.call(eles);
		eles.forEach(function (ele) {
			ele.innerHTML = chrome.i18n.getMessage(ele.getAttribute('i18n-content')) || 'Error:No Message';
		});

		// i18n node attribute
		eles = document.querySelectorAll('[i18n-value]');
		eles = Array.prototype.slice.call(eles);
		eles.forEach(function (ele) {
			var attrs = ele.getAttribute('i18n-value').split(';');
			attrs.forEach(function (attr) {
				attr = attr.split(':');
				if(attr.length < 1) return;
				ele.setAttribute(attr[0].trim(),chrome.i18n.getMessage(attr[1].trim()) || 'Error:No values');
			})
		});
	})();

})();
