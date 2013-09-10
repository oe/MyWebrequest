(function  () {
	var blockrule = {},
		hstsrule = {},
		referrule = {},
		logrule = {},
		logNum = 0,
		requestCache = {};

	var pattern = /^(\*|https|http):\/\/(\*((\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,4})?|([a-zA-Z0-9]+\.)+[a-zA-Z]{2,4})\/$/;

	function cloneObj (o) {
		var obj,i;
		if (Array.isArray(o)) {
			if (o.length > 1) {
				obj = [];
			} else {
				return o[0];
			}
		} else {
			obj = {};
		}
		for (i in o) {
			if (o.hasOwnProperty(i)) {
				obj[i] = o[i] instanceof Object ? cloneObj(o[i]) : o[i];
			}
		}
		return obj;
	}

	function formatQueryBody (url) {
		var obj = {},i,arr,tmp,formated = {};
		i = url.indexOf('?');
		if (i === -1) {
			return {error: 'No query data'};
		}
		url = url.substr(++i);
		obj.sourceData = url;
		arr = url.split('&');
		i = arr.length;
		// obj.formatedData = {};
		try{
			while (i--) {
				tmp = arr[i].split('=');
				if (tmp.length < 2) {
					throw new Error('Somme data not key-value paired is found the query string.')
				}
				formated[decodeURIComponent(tmp[0])] = decodeURIComponent(tmp[1]);
			}
			obj.formatedData = formated;
		} catch(e) {
			if (e instanceof URIError) {
				obj.error = 'The query string is not encoded with utf-8, this can\'t be decoded by now.';
			} else {
				obj.error = e.message;
			}
		}
		return obj;
	}

	function formatHeaders (headers) {
		var obj = {},i = headers.length;
		while (i--) {
			obj[headers[i].name] = headers[i].value;
		}
		return obj;
	}

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

	function logBody (details) {
		//only post data in requestbody,get data is in url
		if (details.requestBody) {
			requestCache[details.requestId] = cloneObj(details.requestBody);
		}
	}

	function logRequest (details) {
		var id = details.requestId;
		++logNum;
		if (requestCache[id]) {
			details.requestBody = requestCache[id];
		}
		details.requestHeaders = formatHeaders(details.requestHeaders);
		details.queryBody = formatQueryBody(details.url);
		console.log('%c%d %o','color: #086', logNum, details);
		delete requestCache[id];
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
			reqApi.onBeforeRequest.addListener(logBody,logrule,['requestBody']);
			reqApi.onSendHeaders.addListener(logRequest,logrule,['requestHeaders']);
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
			onoff = JSON.parse(localStorage.onoff || '{}');

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
					reqApi.onBeforeRequest.removeListener(logBody);
					reqApi.onBeforeRequest.removeListener(logRequest);
					setTimeout(function (fn,filter) {
						reqApi.onBeforeRequest.addListener(logBody,logrule,['requestBody']);
						reqApi.onBeforeRequest.addListener(fn,filter,['requestHeaders']);
					}, 0,logRequest,logrule);
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
						reqApi.onBeforeRequest.addListener(logBody,logrule,['requestBody']);
						reqApi.onSendHeaders.addListener(logRequest,logrule,['requestHeaders']);
					} else {
						console.log(' event log off');
						reqApi.onBeforeRequest.removeListener(logBody);
						reqApi.onSendHeaders.removeListener(logRequest);
					}
				}
				break;
		}
	});
})()