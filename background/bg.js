(function  () {
	var reqFilter = {
			urls:
			[
				// '*://*.baidu.com/*',
				'http://*.wikipedia.org/*',
				'http://*.wordpress.com/*'
			]
		},
		hdrFilter = {
			urls:
			[
				'http://*.baidu.com/*'
			]
		},
		logFilter = {
			urls:
			[
				'*://*/*'
			]
		},
		logNum = 0;

	function blockReq (details) {
		return {cancel: true};
	}

	function hstsReq (details) {
		return {redirectUrl:details.url.replace('http://','https://')};
	}

	function modifyRequest (details) {
		var type = '';
		switch(type) {
			// cancel request
			case 'block':
				return {cancel: true};
				break;
			// force https link
			case 'hsts':
				return {redirectUrl:details.url.replace('http://','https://')};
				break;
		}
	}

	function modifyHeaders (details) {
		var headers = details.requestHeaders,
			len = headers.length,
			type = '';
		switch(type) {
			case 'referer':
				while (len--) {
					if (headers[len].name === 'Referer') {
						headers[len].value = newReferer;
						break;
					}
				}
				break;
			case 'a':
				break;
		}
		return {requestHeaders: headers};
	}

	function logHeaders (details) {
		++logNum;
		console.log('%c%d %o','color: #086', logNum, details);
	}

	//execute init when browser opened
	function init () {
		var onoff = JSON.parse(localStorage.onoff || {}),
			reqApi = chrome.webRequest;
		reqFilter = JSON.parse(localStorage.reqfilter || {});
		hdrFilter = JSON.parse(localStorage.hdrfilter || {});
		logFilter = JSON.parse(localStorage.logfilter || {});

		if (/*reqFilter is available*/true && onoff.reqfilter) {
			reqApi.onBeforeRequest.addListener(modifyRequest,reqFilter,['blocking']);
		} else {
			onoff.reqfilter = false;
		}

		if (/*hdrFilter is available*/true && onoff.hdrfilter) {
			reqApi.onBeforeSendHeaders.addListener(modifyHeaders,hdrFilter,['requestHeaders']);
		} else {
			onoff.hdrfilter = false;
		}

		if (/*logFilter is available*/true && onoff.logfilter) {
			reqApi.onSendHeaders.addListener(logHeaders,reqFilter,['requestHeaders']);
		} else {
			onoff.logfilter = false;
		}

		localStorage.onoff = JSON.stringify(onoff);
	}

	window.addEventListener("storage", function  (event){
		var type = event.key,
			reqApi = chrome.webRequest,
			newData = JSON.parse(event.newValue || {}),
			oldData = JSON.parse(event.oldValue || {}),
			onoff = JSON.parse(localStorage.onoff || {});

		switch(type) {
			case 'reqfilter':
				reqFilter = newData;
				if(/*if filter is *not* available*/true && onoff.reqfilter){
					onoff.reqfilter = false;
					reqApi.onBeforeRequest.removeListener(modifyRequest);
					localStorage.onoff = JSON.stringify(onoff);

				}
				break;
			case 'hdrfilter':
				hdrFilter = newData;
				if(/*if filter is *not* available*/true && onoff.hdrfilter){
					onoff.hdrfilter = false;
					reqApi.onBeforeSendHeaders.removeListener(modifyHeaders);
					localStorage.onoff = JSON.stringify(onoff);

				}
				break;
			case 'logfilter':
				logFilter = newData;
				if(/*if filter is *not* available*/true && onoff.logfilter){
					onoff.logfilter = false;
					reqApi.onSendHeaders.removeListener(logHeaders);
					localStorage.onoff = JSON.stringify(onoff);
				}
				break;
			case 'onoff':
				if (newData.reqfilter !== oldData.reqfilter) {
					if (newData.reqfilter) {
						if (/*filter available*/true) {
							reqApi.onBeforeRequest.addListener(modifyRequest,reqFilter,['blocking']);
						} else {
							newData.reqfilter = false;
							localStorage.onoff = JSON.stringify(newData);
						}
					} else {
						reqApi.onBeforeRequest.removeListener(modifyRequest);
					}
				}
				if (newData.hdrfilter !== oldData.hdrfilter) {
					if (newData.hdrfilter) {
						if (/*filter available*/true) {
							reqApi.onBeforeSendHeaders.addListener(modifyHeaders,hdrFilter,['requestHeaders']);
						} else {
							newData.hdrfilter = false;
							localStorage.onoff = JSON.stringify(newData);
						}
					} else {
						reqApi.onBeforeSendHeaders.removeListener(modifyHeaders);
					}
				}
				if (newData.logfilter !== oldData.logfilter) {
					if (newData.logfilter) {
						if (/*filter available*/true) {
							reqApi.onSendHeaders.addListener(logHeaders,reqFilter,['requestHeaders']);
						} else {
							newData.logfilter = false;
							localStorage.onoff = JSON.stringify(newData);

						}
					} else {
						reqApi.onSendHeaders.removeListener(logHeaders);
					}
				}
				break;
		}
	});

})()