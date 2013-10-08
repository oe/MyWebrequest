$(function ($) {
	var hash = window.location.hash || '#block',
		currentRule = '',
		rules = {},
		dialogOKCB = null,
		TABNODATATR = '<tr nodata><td colspan="3" class="align-center">' + chrome.i18n.getMessage('opt_no_rules') + '</td></tr>';


	if (!$('section' + hash).length) {
		hash = '#block';
	}
	//nav link click
	$('a[href^=#]').on('click',function (e) {
		var $this = $(this),
			targetId = $this.attr('href'),
			$navLink = $('#nav a[href=' + targetId + ']');
		if ($navLink && $('section' + targetId).length) {
			$('#nav li').removeClass('current');
			$navLink.parent().addClass('current');
			window.location.hash = targetId;
			currentRule = targetId.replace('#','');
			initTable(currentRule);
		}
	});
	//hash init
	$('#nav a[href=' + hash + ']').click();
	//init rules
	(function init (rules) {
		var arr,key,i,j;
		rules.block= {};
		rules.refer = {};
		rules.log = {};
		rules.hsts = {};
		for (key in rules) {
			arr = localStorage[key] || '[]';
			arr = JSON.parse(arr);
			j = arr.length;
			i = 0;
			while (j--) {
				++i;
				rules[key][i] = arr[i];
			}
		}
	})(rules);

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
		var secId = $(this).parents('section').attr('id'),
			$ruleField = $(this).parents('.rule-field'),
			$protocol = $ruleField.find('select[name="protocol"]'),
			$host = $ruleField.find('input[name="host"]'),
			$path = $ruleField.find('input[name="path"]'),
			data ={
				protocol: $protocol.val().trim(),
				host: $host.val().trim(),
				path: $path.val().trim()
			},
			hostReg = /^(\*((\.[a-z0-9-]+)*\.[a-z]{2,4})?|([a-z0-9-]+\.)+[a-z]{2,4})$/,
			pathReg = /^[\*a-z]*$/,
			dlg = {},
			ruleObj = rules[secId],
			$tbody = $('#' + secId + ' tbody'),
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
		//TODO:check whether the rule is duplicated
		
		str = '<tr>';
		str +=		'<td><input type="checkbox" value="' + 12 + '"> </td>';
		str +=		'<td title="' + rule + '">';
		str +=			rule;
		str +=		'<td class="delete">' + chrome.i18n.getMessage('opt_delete_text') + '</td>';
		str += '</tr>';
		if (!$tbody.find('tr').length || $tbody.find('tr[nodata]').length) {
			$tbody.html(str);
			$tbody.parent().find('thead input,thead button').prop('disabled',false);
		} else {
			$tbody.prepend(str);
		}
		//TODO ADD rule to localStorage

		$host.val('');
		$path.val('');
		$host.focus();
	});

	//delete multi function
	$('.rules .multi-delete').on('click',function (e) {
		var secId = $(this).parents('section').attr('id'),
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
				timeout: 1000
			};
		}
		showDialog(config);
	});


	//delete one rule
	$('.rules tbody').on('click','.delete',function (e) {
		var $tr = $(this).parent(),
			key = $tr.find('input').attr('value'),
			ruleArr;
		$tr.addClass('fadeOutDown');
		if (rules[currentRule][key]) {
			delete rules[currentRule][key];
			localStorage[currentRule] = JSON.stringify(getObjValues(rules[currentRule]));
		}
		setTimeout(function () {
			var $tbody = $tr.parent(),
				trCunt;
			$tr.remove();
			trCunt = $tbody.find('tr').length;
			if (!trCunt) {
				$tbody.html(TABNODATATR);
				$tbody.parent().find('thead input,thead button').prop('disabled',true);
			} else if (trCunt === $tbody.find('input:checked').length) {
				$tbody.parent().find('thead input[type="checkbox"]').prop('checked',true);
			}
		}, 220);
	});

	$(document).on('keydown',function (e) {
		if (e.keyCode === 27 && !$('#overlay-wrapper').prop('hidden')) {
			$('.dialog .cancel').click();
			console.log('hahah');
		}
	});

	$('.dialog').on('click','.cancel',hideDialog);

	$('#dialog-ok-btn').on('click',function (e) {
		hideDialog();
		if (dialogOKCB) {
			dialogOKCB.call();
		}
	});

	function initTable(secId) {
		var ruleObj,
			str = '',
			$tbody = $('#' + secId + ' tbody'),
			delStr = '<td class="delete">' + chrome.i18n.getMessage('opt_delete_text') + '</td>',
			key,
			cunt = 0;

		if(!$tbody.length) return;
		ruleObj = rules[secId] || {};
		for (key in ruleObj) {
			++cunt;
			if (ruleObj.hasOwnProperty(key)) {
					str += '<tr>';
					str +=		'<td><input type="checkbox" value="' + key + '"> </td>';
					str +=		'<td title="' + ruleObj[key] + '">';
					str +=			ruleObj[key];
					str +=		delStr;
					str += '</tr>';
			}
		}
		$('#' + secId + ' .rule-cunt-num').text(cunt);
		if (!str) {
			$tbody.parent().find('thead input,thead button').prop('disabled',true);
			str = TABNODATATR;
		}
		$tbody.html(str);
	}

	function deleteRules (secId) {
		var $tbody = $('#' + secId + ' tbody'),
			$checkTrs = $tbody.find('tr input:checked'),
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
			if (!$tbody.find('tr').length) {
				$tbody.html(TABNODATATR);
			}
		}
	}

	function getObjValues (obj) {
		var arr = [],key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				arr.push(obj[key]);
			}
		}
		return arr;
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
			dlgTitle = $('#dialog-title'),
			dlgContent = $('#dialog-content'),
			dlgOKBtn = $('#dialog-ok-btn'),
			dlgCancelBtn = $('#dialog-cancel-btn');
		config = config || {};

		$overlayWrapper.removeClass('fadeOutUp');
		$(document.body).addClass('ovHidden');
		$overlayWrapper.prop('hidden',false);
		$overlayWrapper.addClass('fadeInDown');

		dlgTitle.text(config.title || 'No title');
		dlgContent.html(config.content || 'No content');
		dlgOKBtn.prop('hidden',!!config.hideOK);
		dlgCancelBtn.prop('hidden',!!config.hideCancel);

		if ($.isFunction(config.callback)) {
			dialogOKCB = config.callback;
			dlgOKBtn.removeClass('cancel');
		} else {
			dialogOKCB = null;
			dlgOKBtn.addClass('cancel');
		}
		if ($.isNumeric(config.timeout) && config.timeout > 0) {
			setTimeout(hideDialog,config.timeout);
		}
	}
});