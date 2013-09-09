(function  () {
	var blockrule = {},
		hstsrule = {},
		referrule = {},
		logrule = {},
		logNum = 0;

	var pattern = /^(\*|https|http):\/\/(\*((\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,4})?|([a-zA-Z0-9]+\.)+[a-zA-Z]{2,4})\/$/;
	function blockReq (details) {
		return {cancel: true};
	}

	function hstsReq (details) {
		return {redirectUrl:details.url.replace('http://','https://')};
	}

	function modifyReferer (details) {
		var headers = details.requestHeaders,
			len = headers.length,
			type = '',
			newReferer = '';
		while (len--) {
			if (headers[len].name === 'Referer') {
				//delete referrer
				headers.splice(len,1);
				break;
			}
		}
		return {requestHeaders: headers};
	}

	function logHeaders (details) {
		++logNum;
		console.log('%c%d %o','color: #086', logNum, details);
	}

	//execute init when browser opened
	(function init () {
		var onoff = JSON.parse(localStorage.onoff || '{}'),
			reqApi = chrome.webRequest;
		blockrule.urls = JSON.parse(localStorage.blockrule || '[]');
		hstsrule.urls = JSON.parse(localStorage.hstsrule || '[]');
		referrule.urls = JSON.parse(localStorage.referrule || '[]');
		logrule.urls = JSON.parse(localStorage.logrule || '[]');

		if (onoff.blockrule && blockrule.urls.length) {
			reqApi.onBeforeRequest.addListener(blockReq,blockrule,['blocking']);
		} else {
			onoff.blockrule = false;
		}

		if (onoff.hstsrule && hstsrule.urls.length) {
			reqApi.onBeforeRequest.addListener(hstsReq,hstsrule,['blocking']);
		} else {
			onoff.hstsrule = false;
		}

		if (onoff.referrule && referrule.urls.length) {
			reqApi.onBeforeSendHeaders.addListener(modifyReferer,referrule,['requestHeaders','blocking']);
		} else {
			onoff.referrule = false;
		}

		if (onoff.logrule && logrule.urls.length) {
			reqApi.onSendHeaders.addListener(logHeaders,logrule,['requestHeaders']);
		} else {
			onoff.logrule = false;
		}

		localStorage.onoff = JSON.stringify(onoff);
	})();

	window.addEventListener("storage", function  (event){
		var type = event.key,
			reqApi = chrome.webRequest,
			newData = JSON.parse(event.newValue || '[]'),
			oldData = JSON.parse(event.oldValue || '[]'),
			onoff = JSON.parse(localStorage.onoff || '[]');

		switch(type) {
			case 'blockrule':
				blockrule.urls = newData;
				if (onoff.blockrule) {
					reqApi.onBeforeRequest.removeListener(blockReq);
					setTimeout(function (fn,filter) {
						reqApi.onBeforeRequest.addListener(fn,filter,['blocking']);
					}, 0,blockReq,blockrule);
				}
				break;
			case 'hstsrule':
				hstsrule.urls = newData;
				if (onoff.hstsrule) {
					reqApi.onBeforeRequest.removeListener(hstsReq);
					setTimeout(function (fn,filter) {
						reqApi.onBeforeRequest.addListener(fn,filter,['blocking']);
					}, 0,hstsReq,hstsrule);
				}
				break;
			case 'referrule':
				referrule.urls = newData;
				if (onoff.referrule) {
					reqApi.onBeforeRequest.removeListener(modifyReferer);
					setTimeout(function (fn,filter) {
						reqApi.onBeforeRequest.addListener(fn,filter,['requestHeaders','blocking']);
					}, 0,modifyReferer,referrule);
				}
				break;
			case 'logrule':
				logrule.urls = newData;
				if (onoff.logrule) {
					reqApi.onBeforeRequest.removeListener(logHeaders);
					setTimeout(function (fn,filter) {
						reqApi.onBeforeRequest.addListener(fn,filter,['requestHeaders']);
					}, 0,logHeaders,logrule);
				}
				break;
			case 'onoff':
				if (newData.blockrule !== oldData.blockrule) {
					if (newData.blockrule) {
						reqApi.onBeforeRequest.addListener(blockReq,blockrule,['blocking']);
						console.log('off event block on');
					} else {
						reqApi.onBeforeRequest.removeListener(blockReq);
						console.log('off event block off');
					}
				}
				if (newData.hstsrule !== oldData.hstsrule) {
					if (newData.hstsrule) {
						reqApi.onBeforeRequest.addListener(hstsReq,hstsrule,['blocking']);
					} else {
						reqApi.onBeforeRequest.removeListener(hstsReq);
					}
				}
				if (newData.referrule !== oldData.referrule) {
					if (newData.referrule) {
						console.log(' event rerfer on');
						reqApi.onBeforeSendHeaders.addListener(modifyReferer,referrule,['requestHeaders','blocking']);
					} else {
						console.log(' event rerfer off');
						reqApi.onBeforeSendHeaders.removeListener(modifyReferer);
					}
				}
				if (newData.logrule !== oldData.logrule) {
					if (newData.logrule) {
						console.log(' event log on')
						reqApi.onSendHeaders.addListener(logHeaders,logrule,['requestHeaders']);
					} else {
						console.log(' event log off');
						reqApi.onSendHeaders.removeListener(logHeaders);
					}
				}
				break;
		}
	});
})()