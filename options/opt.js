//TODO: 1. add rule: error tips style, help tip
//		2. Help is to be continued

$(function ($) {
	var hash = window.location.hash.replace('#','') || 'block',
		rules = {},
		dialogOKCB = null,
		TABNODATATR = '<tr nodata><td colspan="3" class="align-center">' + chrome.i18n.getMessage('opt_no_rules') + '</td></tr>',
		qrcode = new QRCode('qrcode-area', {
			width : 200,
			height : 200
		});

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
	$('a[href^=#]').on('click',function (e) {
		var $this = $(this),
			targetId = $this.attr('href').replace('#',''),
			$navLink = $('#nav a[href=#' + targetId + ']'),
			$requestSec = $('#request-settings');
		if ($navLink) {
			if ($navLink.parent().hasClass('active')) return;
			$('#nav li').removeClass('active');
			$navLink.parent().addClass('active');
			window.location.hash = targetId;
			if (['block','hsts','refer','log'].indexOf(targetId) > -1) {
				$requestSec.attr('data-id',targetId);
				$requestSec.removeClass('active');
				initRequestSection(targetId);
				$('#fun-name').text($navLink.text());
				$('#fun-desc').text(chrome.i18n.getMessage('opt_' + targetId + '_desc'));
				setTimeout(function () {
					$requestSec.addClass('active');
				}, 20);
				return false;
			} else {
				$requestSec.removeClass('active');
				setTimeout(function () {
					$('#qrcode .tab-pane.active .input:first').focus();
				},0);
			}
		}
	});

	// enable or disable a function
	$('section .switch-input').on('change',function (e) {
		var secId = $('#request-settings').attr('data-id'),
			enabled = $(this).prop('checked'),
			onoff = JSON.parse(localStorage.onoff || '') || {};
		onoff[secId] = enabled;
		localStorage.onoff = JSON.stringify(onoff);
	});

	//hash init
	if(['block','hsts','refer','log','qrcode','help'].indexOf(hash) === -1) hash = 'block';
	$('#nav a[href=#' + hash + ']').click();

	//input box [host] enter key
	$('.rule-field').on('keyup','input[name="host"]',function (e) {
		var $path;
		if (e.keyCode === 13) {
			$path = $(this).parents('.rule-field').find('input[name="path"]');
			if ($path.val() === '') {
				$path.focus();
			} else {
				$(this).parents('.rule-field').find('.add-rule').click();
			}
		}
	});

	//input box [path]
	$('.rule-field').on('keyup','input[name="path"]',function (e) {
		if (e.keyCode === 13) {
			$(this).parents('.rule-field').find('.add-rule').click();
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
			hostReg = /^(\*((\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,4})?|([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,4})$/,
			pathReg = /^[\*a-z]*$/,
			dlg = {},
			ruleObj = rules[secId],
			$tbody = $('#request-settings tbody'),
			rule,str;
		if (['*','http','https'].indexOf(data.protocol) < 0 ) {
			dlg.title = 'Protocol is not valid';
			dlg.content = 'Have U modified option page? Just reload it again please.';
			dlg.hideCancel = true;
			showDialog(dlg);
			return;
		}
		if (!data.host || !hostReg.test(data.host.toLowerCase())) {
			dlg.title = 'Host is not valid';
			dlg.content = 'Please see help for more infomation';
			dlg.hideCancel = true;
			showDialog(dlg);
			return;
		}
		//Path treat empty as star(*)
		if ('' === data.path) {
			data.path = '*';
		}
		if (!data.path || !pathReg.test(data.path.toLowerCase())) {
			dlg.title = 'Path is not valid';
			dlg.content = 'Please see help for more infomation';
			dlg.hideCancel = true;
			showDialog(dlg);
			return;
		}
		rule = data.protocol + '://' + data.host + '/' + data.path;
		if (isValueInObj(ruleObj,rule)) {
			alert('Rule is exist');
			return;
		}
		++ruleObj.max;
		ruleObj[ruleObj.max] = rule;
		str = '<tr>';
		str +=		'<td><input type="checkbox" value="' + ruleObj.max + '"> </td>';
		str +=		'<td title="' + rule + '">';
		str +=			rule;
		str +=		'<td class="delete">' + chrome.i18n.getMessage('opt_delete_text') + '</td>';
		str += '</tr>';
		if (!$tbody.find('tr').length || $tbody.find('tr[nodata]').length) {
			$tbody.html(str);
			$('#request-settings .switch-input').prop('disabled',false);
			$tbody.parent().find('thead input,thead button').prop('disabled',false);
			$('#request-settings .enable-tip').prop('hidden',true);
		} else {
			$tbody.prepend(str);
		}
		localStorage[secId] = JSON.stringify(getObjValues(ruleObj));

		$('#request-settings .rule-cunt-num').text($tbody.find('tr').length);
		$host.val('');
		$path.val('');
		$host.focus();
	});

	//delete multi function
	$('.rules .multi-delete').on('click',function (e) {
		var secId = $('#request-settings').attr('data-id'),
			len = $(this).parents('table').find('tbody input:checked').length,
			config;
		if (len) {
			config = {
				title: chrome.i18n.getMessage('opt_deldlg_title'),
				content: chrome.i18n.getMessage('opt_deldlg_content').replace('xx',len),
				callback: function () {
					deleteRules(secId);
				}
			};
		} else {
			config = {
				title: chrome.i18n.getMessage('opt_nochosedlg_title'),
				content: chrome.i18n.getMessage('opt_nochosedlg_content') || 'Nothing',
				hideCancel: true,
				timeout: 1000,
				focusOnOK: true
			};
		}
		showDialog(config);
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
				$enable = $('#request .switch-input'),
				trCunt;
			$tr.remove();
			trCunt = $tbody.find('tr').length;
			$('#request .rule-cunt-num').text($tbody.find('tr').length);
			if (!trCunt) {
				$tbody.html(TABNODATATR);
				$enable.prop('checked',false).trigger('change');
				$enable.prop('disabled',true);
				$('#request .enable-tip').prop('hidden',false);
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

	//dialog escape key
	$(document).on('keydown',function (e) {
		if (e.keyCode === 27 && !$('#overlay-wrapper').prop('hidden')) {
			$('.dialog .cancel').click();
		}
	});

	$('.dialog').on('click','.cancel',hideDialog);

	$('#dialog-ok-btn').on('click',function (e) {
		hideDialog();
		if (dialogOKCB) {
			dialogOKCB.call();
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

	//generate QR Code
	$('.tab-content').on('keyup','.input',function (e) {
		var $tab = $(this).parents('.tab-pane'),
			type = $tab.attr('data-type'),
			str;
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
		if (str) {
			try {
				qrcode.makeCode(str);
			} catch (e) {
				alert(e.message);
			}
		} else {
			qrcode._el.querySelector('img').style.display = 'none';
		}
	});


	function initRequestSection(secId) {
		var ruleObj,
			str = '',
			$tbody = $('#request-settings tbody'),
			$enable = $('#request-settings .switch-input'),
			delStr = '<td class="delete">' + chrome.i18n.getMessage('opt_delete_text') + '</td>',
			$protocol = $('#b-protocol'),
			key,
			$firstInput = $('#b-host'),
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
		if (secId === 'hsts') {
			$protocol.val('http').attr('disabled',true);
		} else {
			$protocol.val('*').attr('disabled',false);
		}
		$tbody.html(str);
	}

	function deleteRules (secId) {
		var $tbody = $('#request-settings tbody'),
			$checkTrs = $tbody.find('tr input:checked'),
			$enable = $('#request-settings .switch-input'),
			keys = $checkTrs.map(function () {
					return this.value;
				}).get(),
			ruleObj = rules[secId],
			len = keys.length;
		if (len) {
			//delete all
			if (len === $tbody.find('tr').length) {
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

			localStorage[secId] = JSON.stringify(getObjValues(ruleObj));

			$('#request-settings .rule-cunt-num').text($tbody.find('tr').length);
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
			$dlgOKBtn.removeClass('cancel');
		} else {
			dialogOKCB = null;
			$dlgOKBtn.addClass('cancel');
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