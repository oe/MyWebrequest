var qrelm = document.getElementById('qrcode-wrapper'),
	qrimg = document.getElementById('qrcode'),
	text = document.getElementById('text'),
	textWrapper = document.getElementById('text-wrapper'),
	cunt = document.getElementById('letter-cunt'),
	makeBtn = document.getElementById('make'),
	prompt = document.getElementById('prompt'),
	actionTip = document.getElementById('action-tip'),
	googleDown = document.getElementById('ntwk-error'),
	tooLong = document.getElementById('long-error'),
	content = '';

	qrimg.onerror = function (e) {
		googleDown.removeAttribute('hidden');
	};
chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
}, function(tabs) {
    var tab = tabs[0];
    content = tab.url;
	qrimg.src = 'http://chart.apis.google.com/chart?cht=qr&chs=200x200&chld=L|0&choe=UTF-8&chl=' + encodeURIComponent(content);
});
// http://chart.apis.google.com/chart?cht=qr&chs=350x350&chld=L|0&choe=UTF-8&chl=
function makeQRCode () {
	var encoded = '';
	prompt.innerHTML = chrome.i18n.getMessage('pop_get_new');
	content = text.value;
	encoded = encodeURIComponent(content);
	if (encoded.length > 1900) {
		textWrapper.classList.add('error');
		tooLong.removeAttribute('hidden');
		setTimeout(function () {
			textWrapper.classList.remove('error');
			tooLong.setAttribute('hidden');
		}, 3000);
		return;
	}
	qrimg.src = 'http://chart.apis.google.com/chart?cht=qr&chs=200x200&chld=L|0&choe=UTF-8&chl=' + encoded;
    textWrapper.classList.remove('focus');
	qrelm.style.display = 'block';
	googleDown.setAttribute('hidden');
	actionTip.innerText = chrome.i18n.getMessage('pop_action_tip');
	qrelm.focus();
}

qrelm.addEventListener('dblclick',function (e) {
	prompt.innerText = chrome.i18n.getMessage('pop_edit_promp');
	actionTip.innerText = chrome.i18n.getMessage('pop_edit_tip');
	this.style.display = 'none';
	text.value = content;
	textWrapper.classList.add('focus');
	cunt.innerText = content.length + '/300';
	text.select();
	text.focus();
},false);

text.addEventListener('keydown',function (e) {
	if (e.ctrlKey && e.keyCode === 13) {
		makeQRCode();
	}
},false);

text.addEventListener('keyup',function (e) {
	cunt.innerText = this.value.length + '/300';
},false);

makeBtn.addEventListener('click',makeQRCode,false);