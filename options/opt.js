//TODO: 1.error tips need to be beautified
//		2. Help is to be continued
//		3. when add rule check whether it will disable the qrcode

$(function ($) {
	var hash = window.location.hash.replace('#','') || 'block',
		rules = {},
		dialogOKCB = null,
		TABNODATATR = '<tr nodata><td colspan="3" class="align-center">' + chrome.i18n.getMessage('opt_no_rules') + '</td></tr>';

	//init rules
	(function init (rules) {
		var arr,key,i,j;
		rules.block= {};
		rules.refer = {};
		rules.log = {};
		rules.hsts = {};
		for (key in rules) {
			arr = JSON.parse(localStorage[key] || '[]');
			j = arr.length;
			i = 0;
			rules[key].max = j;
			while (j--) {
				++i;
				rules[key][i] = arr[j];
			}
		}
	})(rules);

	//nav link click
	$(document).on('click','a[href^=#]',function (e) {
		var $this = $(this),
			targetId = $this.attr('href').replace('#',''),
			$navLink = $('#nav a[href=#' + targetId + ']'),
			$requestSec = $('#request-settings');
		if ($navLink) {
			if ($navLink.parent().hasClass('active')) return;
			$('#nav li').removeClass('active');
			$navLink.parent().addClass('active');
			window.location.hash = targetId;
			if (['block','hsts','refer','log'].indexOf(targetId) !== -1) {
				$requestSec.attr('data-id',targetId);
				$requestSec.removeClass('active');
				initRequestSection(targetId);
				$('#fun-name').text($navLink.text());
				$('#fun-desc').text(chrome.i18n.getMessage('opt_' + targetId + '_desc'));
				setTimeout(function () {
					$requestSec.addClass('active');
				}, 20);
			} else {
				$requestSec.removeClass('active');
				setTimeout(function () {
					$('#qrcode .tab-pane.active .input:first').focus();
				},0);
			}
		}
	});
	

	// enable or disable a function
	$('#request-settings .switch-input').on('change',function (e) {
		var secId = $('#request-settings').attr('data-id'),
			enabled = $(this).prop('checked'),
			onoff = JSON.parse(localStorage.onoff || '') || {};
		onoff[secId] = enabled;
		localStorage.onoff = JSON.stringify(onoff);
	});

	//hash init
	if(['block','hsts','refer','log','qrcode','help','utility'].indexOf(hash) === -1) hash = 'block';
	$('#nav a[href=#' + hash + ']').click();

	document.getElementById('qrimg').onerror = function (e) {
		this.setAttribute('hidden');
		showDialog({
			title: chrome.i18n.getMessage('opt_errtip_gtitle'),
			content: chrome.i18n.getMessage('opt_errtip_gcontent'),
			hideCancel: true,
			focusOnOK: true
		});
	};

	//input box [host] enter key
	$('#host').on('keyup',function (e) {
		var $path;
		if (e.keyCode === 13) {
			$path = $(this).parents('.rule-field').find('input[name="path"]');
			if ($path.val() === '') {
				$path.focus();
			} else {
				$(this).parents('.rule-field').find('.add-rule').click();
				return false;
			}
		}
	});
	//paste string in host input box
	$('#host').on('paste',function (e) {
		var str = e.originalEvent.clipboardData.getData('text/plain'),
			arr,i,tmp;
		// hash in a url is unnecessary, remove it
		i = str.indexOf('#');
		if (~i) {
			str = str.substring(0,i);
		}
		str = str.trim();
		if (str !== '') {
			i = str.indexOf('://');
			if (~i) {
				if (!i) return true;
				arr = str.split('://');
				if (arr.length !== 2) return true;
				tmp = arr[0].trim();
				if (!~['*','http','https'].indexOf(tmp)) return true;
				if (!$('#protocol').prop('disabled')) {
					$('#protocol').val(tmp);
				}
				tmp = arr[1].trim();
				arr = tmp.split('/');
				$('#host').val(arr[0]);
				if (arr[1] !== undefined) {
					arr.shift();
					$('#path').val(arr.join('/'));
				}
				arr = null;
				return false;
			} else if(str.indexOf('/') > 0) {
				arr = str.split('/');
				$('#host').val(arr[0]);
				if (arr[1] !== undefined) {
					arr.shift();
					$('#path').val(arr.join('/'));
				}
				arr = null;
				return false;
			}
		}
		return true;
	});

	//input box [path] enter key
	$('#path').on('keyup',function (e) {
		if (e.keyCode === 13) {
			$(this).parents('.rule-field').find('.add-rule').click();
			return false;
		}
	});

	//add rule
	$('.rule-field').on('click','.add-rule',function (e) {
		var secId = $('#request-settings').attr('data-id'),
			$ruleField = $(this).parents('.rule-field'),
			$protocol = $ruleField.find('select[name="protocol"]'),
			$host = $ruleField.find('input[name="host"]'),
			$path = $ruleField.find('input[name="path"]'),
			data ={
				protocol: $protocol.val().trim(),
				host: $host.val().trim(),
				path: $path.val().trim()
			},
			ipReg = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])$/,
			hostReg = /^(\*((\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,4})?|([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,4})$/,
			pathReg = /^[a-z0-9-_\+=&%@!\.,\*\?\|~\/]+$/,
			dlg = {},
			ruleObj = rules[secId],
			$tbody = $('#request-settings tbody'),
			rule,str;
		if (['*','http','https'].indexOf(data.protocol) === -1 ) {
			showTip($protocol,chrome.i18n.getMessage('opt_errtip_protocol'));
			return;
		}
		data.host = data.host.toLowerCase();
		if (!data.host || (!hostReg.test(data.host) && !ipReg.test(data.host))) {
			showTip($host,chrome.i18n.getMessage('opt_errtip_host'));
			return false;
		}
		//Path treat empty as star(*)
		if ('' === data.path) {
			data.path = '*';
		}
		if (!data.path || !pathReg.test(data.path.toLowerCase())) {
			showTip($path,chrome.i18n.getMessage('opt_errtip_path'));
			return false;
		}
		rule = data.protocol + '://' + data.host + '/' + data.path;
		if (rule.length > 500) {
			showTip($host,chrome.i18n.getMessage('opt_errtip_rulelong'));
			return false;
		}
		//whether rule is duplicated
		if (isValueInObj(ruleObj,rule)) {
			showTip($host,chrome.i18n.getMessage('opt_errtip_duplicate'));
			return false;
		}
		if (data.host === '*') {
			if (['block','hsts'].indexOf(secId) !== -1) {
				showDialog({
					title: chrome.i18n.getMessage('opt_errdlg_title'),
					content: chrome.i18n.getMessage('opt_errdlg_cstarqr'),
					callback: addRule,
					cbargs:[rule,secId,$tbody,$host,$path]
				});
				return;
			} else {
				showDialog({
					title: chrome.i18n.getMessage('opt_errdlg_title'),
					content: chrome.i18n.getMessage('opt_errdlg_cstar'),
					callback: addRule,
					cbargs:[rule,secId,$tbody,$host,$path]
				});
				return;
			}
		}
		str = data.host.replace(/\./g,'\\.').replace('*','.*');
		if (['block','hsts'].indexOf(secId) !== -1 && (new RegExp('^' + str + '$')).test('chart.apis.google.com')) {
			showDialog({
				title: chrome.i18n.getMessage('opt_errdlg_title'),
				content: chrome.i18n.getMessage('opt_errdlg_cqr'),
				callback: addRule,
				cbargs:[rule,secId,$tbody,$host,$path]
			});
			return;
		}
		addRule(rule,secId,$tbody,$host,$path);
	});

	//delete multi function
	$('.rules .multi-delete').on('click',function (e) {
		var secId = $('#request-settings').attr('data-id'),
			len = $(this).parents('table').find('tbody input:checked').length;
		if (len) {
			showDialog({
				title: chrome.i18n.getMessage('opt_deldlg_title'),
				content: chrome.i18n.getMessage('opt_deldlg_content').replace('xx',len),
				callback: deleteRules,
				cbargs:[secId]
			});
		} else {
			showTip(this,chrome.i18n.getMessage('opt_errtip_nochose'));
			return false;
		}
	});

	//delete one rule
	$('.rules tbody').on('click','.delete',function (e) {
		var $tr = $(this).parent(),
			secId = $('#request-settings').attr('data-id'),
			key = $tr.find('input').attr('value'),
			ruleArr;
		$tr.addClass('fadeOutDown');
		if (rules[secId][key]) {
			delete rules[secId][key];
			localStorage[secId] = JSON.stringify(getObjValues(rules[secId]));
		}
		setTimeout(function () {
			var $tbody = $tr.parent(),
				$enable = $('#request-settings .switch-input'),
				trCunt;
			$tr.remove();
			trCunt = $tbody.find('tr').length;
			$('#request-settings .rule-cunt-num').text($tbody.find('tr').length);
			if (!trCunt) {
				$tbody.html(TABNODATATR);
				$enable.prop('checked',false).trigger('change');
				$enable.prop('disabled',true);
				$('#request-settings .enable-tip').prop('hidden',false);
				$tbody.parent().find('thead input,thead button').prop('disabled',true);
			} else if (trCunt === $tbody.find('input:checked').length) {
				$tbody.parent().find('thead input[type="checkbox"]').prop('checked',true);
			}
		}, 220);
	});

	//check all
	$('.rules thead input[type="checkbox"]').on('click',function (e) {
		var $this = $(this),
			checked = $this.prop('checked'),
			parent = $this.parents('.rules');
		parent.find('tbody input[type="checkbox"]').prop('checked',checked);
		if (checked) {
			parent.find('tbody tr').addClass('checked');
		} else {
			parent.find('tbody tr').removeClass('checked');
		}
	});

	//tr checkbox
	$('.rules tbody').on('click','input[type="checkbox"]',function (e) {
		var $this = $(this),
			$tr = $this.parents('tr'),
			$tbody = $this.parents('tbody'),
			$checkAll = $this.parents('.rules').find('thead input[type="checkbox"]');
		if ($this.prop('checked')) {
			$tr.addClass('checked');
			if ($tbody.find('tr').length === $tbody.find('input:checked').length) {
				$checkAll.prop('checked',true);
			}
		} else {
			$tr.removeClass('checked');
			$checkAll.prop('checked',false);
		}
	});

	//hide dialog when pressed escape key
	$(document).on('keydown',function (e) {
		if (e.keyCode === 27 && !$('#overlay-wrapper').prop('hidden')) {
			$('.dialog .cancel').click();
		}
	});
	//hide tooltip when keyup or click
	$(document).on('click keyup',function (e) {
		var $tooltip = $('#tooltip');
		if ($tooltip.hasClass('show')) {
			$tooltip.removeClass('show');
		}
	});

	$('.dialog').on('click','.cancel',hideDialog);

	$('#dialog-ok-btn').on('click',function (e) {
		hideDialog();
		if (dialogOKCB) {
			dialogOKCB.apply(null,dialogOKCB.args);
			dialogOKCB.args = null;
			dialogOKCB = null;
		}
	});

	// change qr code type
	$('.nav-tabs li').on('click',function (e) {
		var $this = $(this),
			target,$tabNav,$tabContent,$target;
		// if ($this.hasClass('active')) return;
		target = $this.attr('data-target');
		$tabNav = $(this).parent();
		$tabNav.find('li.active').removeClass('active');
		$this.addClass('active');
		$tabContent = $tabNav.parent().find('.tab-content');
		$tabContent.find('.tab-pane.active').removeClass('active in');
		$target = $tabContent.find('.tab-pane#tab-' + target);
		$target.addClass('active');
		setTimeout(function () {
			$target.addClass('in');
			$target.find('.input:first').focus();
		}, 0);
	});

	//generate QR Code with short cut
	$('.tab-content').on('keydown','.input',function (e) {
		if (e.ctrlKey && e.keyCode === 13) {
			$(this).parents('.tab-pane').find('.make-qrcode').click();
			return false;
		}
	});

	//generate QR Code
	$('.tab-content').on('click','.make-qrcode',function (e) {
		var $this = $(this),
			$tab = $this.parents('.tab-pane'),
			$errorTip = $this.prev(),
			$qrimg = $('#qrimg'),
			type = $tab.attr('data-type'),
			str = '';
		switch(type) {
			case 'text':
				str = $('#s-text').val().trim();
				break;
			case 'vcard':
				str = getVcardString();
				if (str) {
					str = 'MECARD:' + str + ';;';
				}
				break;
			case 'msg':
				if ($('#s-tel').val().trim() || $('#s-msg').val().trim()) {
					str = 'smsto:' + $('#s-tel').val().trim() + ':' + $('#s-msg').val().trim();
				}
				break;
		}
		if (str !== '') {
			str = encodeURIComponent(str);
			if (str.length > 1900) {
				$errorTip.text(chrome.i18n.getMessage('opt_qrtip_ovfl'));
				$errorTip.prop('hidden',false);
				setTimeout(function () {
					$errorTip.prop('hidden',true);
				}, 3000);
				return;
			}
			$qrimg.attr('src','http://chart.apis.google.com/chart?cht=qr&chs=200x200&chld=L|0&choe=UTF-8&chl=' + str);
			$qrimg.prop('hidden',false);
		} else {
			$errorTip.text(chrome.i18n.getMessage('opt_qrtip_notext'));
			$errorTip.prop('hidden',false);
			$tab.find('.input:first').focus();
			setTimeout(function () {
				$errorTip.prop('hidden',true);
			}, 3000);
			return;
		}
		if ($this.is('textarea')) {
			$tab = $this.next('.letter-cunt');
			if ($tab.length) {
				$tab.text(str.length + '/300');
			}
		}
	});

	//qr textarea input length count
	$('.letter-cunt-wrapper').on('keyup','textarea',function (e) {
		$(this).next().text(this.value.trim().length + '/300');
	});

	function initRequestSection(secId) {
		var ruleObj,
			str = '',
			$tbody = $('#request-settings tbody'),
			$enable = $('#request-settings .switch-input'),
			delStr = '<td class="delete">' + chrome.i18n.getMessage('opt_delete_text') + '</td>',
			$protocol = $('#protocol'),
			key,
			$firstInput = $('#host'),
			onoff = JSON.parse(localStorage.onoff || '') || {},
			cunt = 0;

		setTimeout(function () {
			$firstInput.focus();
		}, 200);
		ruleObj = rules[secId] || {};
		for (key in ruleObj) {
			//only key is a number
			if (!isNaN(key) && ruleObj.hasOwnProperty(key)) {
				++cunt;
				str += '<tr>';
				str +=		'<td><input type="checkbox" value="' + key + '"> </td>';
				str +=		'<td title="' + ruleObj[key] + '">';
				str +=			ruleObj[key];
				str +=		delStr;
				str += '</tr>';
			}
		}
		$('#request-settings .rule-cunt-num').text(cunt);
		if (!str) {
			$enable.prop('checked',false).trigger('change');
			$enable.prop('disabled',true);
			$('#request-settings .enable-tip').prop('hidden',false);
			$tbody.parent().find('thead input,thead button').prop('disabled',true);
			str = TABNODATATR;
		} else {
			$enable.prop('checked',!!onoff[secId]);
			$enable.prop('disabled',false);
			$('#request-settings .enable-tip').prop('hidden',true);
			$tbody.parent().find('thead input,thead button').prop('disabled',false);
		}
		$tbody.parent().find('thead input').prop('checked',false);
		if (secId === 'hsts') {
			$protocol.val('http').attr('disabled',true);
		} else {
			$protocol.val('*').attr('disabled',false);
		}
		$tbody.html(str);
	}

	function addRule (rule,type,$tbody,$host,$path) {
		var ruleObj = rules[type],str = '',
			$tr = $('<tr />');
		++ruleObj.max;
		ruleObj[ruleObj.max] = rule;
		$tr.addClass('new-item');
		str += '<td><input type="checkbox" value="' + ruleObj.max + '"> </td>';
		str += '<td title="' + rule + '">';
		str += 		rule;
		str += '<td class="delete">' + chrome.i18n.getMessage('opt_delete_text') + '</td>';
		$tr.html(str);
		if (!$tbody.find('tr').length || $tbody.find('tr[nodata]').length) {
			$tbody.find('tr').remove();
			$('#request-settings .switch-input').prop('disabled',false);
			$tbody.parent().find('thead input,thead button').prop('disabled',false);
			$('#request-settings .enable-tip').prop('hidden',true);
		}
		$tbody.prepend($tr);
		localStorage[type] = JSON.stringify(getObjValues(ruleObj));

		$('#request-settings .rule-cunt-num').text($tbody.find('tr').length);
		$host.val('');
		$path.val('');
		$host.focus();
		setTimeout(function () {
			$tr.removeClass('new-item');
		}, 600);
	}

	function deleteRules (secId) {
		var $tbody = $('#request-settings tbody'),
			$checkTrs = $tbody.find('tr input:checked'),
			$enable = $('#request-settings .switch-input'),
			keys = $checkTrs.map(function () {
					return this.value;
				}).get(),
			ruleObj = rules[secId],
			len = keys.length,
			trLen = $tbody.find('tr').length;
		if (len) {
			//delete all
			if (len === trLen) {
				$tbody.html(TABNODATATR);
				$tbody.parent().find('thead input').prop('checked',false);
				$tbody.parent().find('thead input,thead button').prop('disabled',true);
				$enable.prop('checked',false).trigger('change');
				$enable.prop('disabled',true);
				$('#request-settings .enable-tip').prop('hidden',false);
				rules[secId] = {};
				ruleObj = {};
			} else {
				$checkTrs.map(function () {
					$(this).parents('tr').remove();
				});
				while (len--) {
					delete ruleObj[keys[len]];
				}
			}
			$('#request-settings .rule-cunt-num').text(trLen - len);
			localStorage[secId] = JSON.stringify(getObjValues(ruleObj));

			if (!$tbody.find('tr').length) {
				$tbody.html(TABNODATATR);
			}
		}
	}

	function getObjValues (obj) {
		var arr = [],key;
		for (key in obj) {
			//only key is number
			if (!isNaN(key) && obj.hasOwnProperty(key)) {
				arr.push(obj[key]);
			}
		}
		return arr;
	}

	function getVcardString () {
		var str = [];
		$('#tab-vcard').find('input,textarea').map(function (el) {
			var $this = $(this);
			if ($this.val() !== '') {
				str.push($this.attr('name') + ':' + $this.val());
			}
		});
		return str.join(';');
	}

	function isValueInObj (obj,value) {
		var prop;
		for (prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				if (obj[prop] === value) return true;
			}
		}
		return false;
	}

	function hideDialog () {
		var $overlayWrapper = $('#overlay-wrapper');
		$overlayWrapper.removeClass('fadeInDown');
		$overlayWrapper.addClass('fadeOutUp');
		setTimeout(function (e) {
			$overlayWrapper.prop('hidden',true);
			$(document.body).removeClass('ovHidden');
		}, 220);
	}
	//show error tip
	function showTip (el,msg) {
		var $el = $(el),
			$tooltip = $('#tooltip'),
			$msg = $('#tooltip-msg'),
			pos = $el.offset();
		$msg.html(msg);
		pos.top += $el.height() + 15;
		pos.left += $el.width() / 2 - $tooltip.width() / 2;
		$tooltip.css({top: pos.top + 'px',left: pos.left + 'px'}).addClass('show');
		$el.focus().select();
	}

	//config: {title: 'title',content: '',hideOK: false, hideCancel: true,focusOnOK:false,callback: fun..,cbargs:[],timeout: 200}
	function showDialog (config) {
		var $overlayWrapper = $('#overlay-wrapper'),
			$dlgTitle = $('#dialog-title'),
			$dlgContent = $('#dialog-content'),
			$dlgOKBtn = $('#dialog-ok-btn'),
			$dlgCancelBtn = $('#dialog-cancel-btn');
		config = config || {};

		$overlayWrapper.removeClass('fadeOutUp');
		$(document.body).addClass('ovHidden');
		$overlayWrapper.prop('hidden',false);
		$overlayWrapper.addClass('fadeInDown');

		$dlgTitle.text(config.title || 'No title');
		$dlgContent.html(config.content || 'No content');
		$dlgOKBtn.prop('hidden',!!config.hideOK);
		$dlgCancelBtn.prop('hidden',!!config.hideCancel);

		if ($.isFunction(config.callback)) {
			dialogOKCB = config.callback;
			dialogOKCB.args = config.cbargs ? config.cbargs : [];
			$dlgOKBtn.removeClass('cancel');
		} else {
			dialogOKCB = null;
		}
		if ($.isNumeric(config.timeout) && config.timeout > 0) {
			setTimeout(hideDialog,config.timeout);
		}
		if (config.focusOnOK) {
			$dlgOKBtn.focus();
		} else {
			$dlgCancelBtn.focus();
		}
	}
});