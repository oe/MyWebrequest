$(function ($) {
	var hash = window.location.hash || '#block',
		section = 'section' + hash,
		currentRule = '';
	if (!$(section).length) {
		hash = '#block';
	}
	//nav link click
	$('a[href^=#]').on('click',function (e) {
		var $this = $(this),
			targetId = $this.attr('href'),
			$navLink = $('#nav a[href=' + targetId + ']');
		if ($navLink) {
			$('#nav li').removeClass('current');
			$navLink.parent().addClass('current');
			window.location.hash = targetId;
			currentRule = targetId.replace('#','');
		}
	});
	//hash init
	$('#nav a[href=' + hash + ']').click();

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

	//delete function
	$('.rules .multi-delete').on('click',function (e) {
		deleteRule($(this).parents('.rules').children('tbody'),currentRule);
	});

	//delete on rule
	$('.rules tbody').on('click','.delete',function (e) {
		deleteRule($(this).parent(),currentRule);
	});

	$(document).on('keydown',function (e) {
		if (e.keyCode === 27 && !$('#overlay-wrapper').prop('hidden')) {
			$('.dialog .cancel').click();
			console.log('hahah');
		}
	});

	$('.dialog').on('click','.cancel',function (e) {
		$overlayWrapper = $('#overlay-wrapper');
		$overlayWrapper.removeClass('fadeInDown');
		$overlayWrapper.addClass('fadeOutUp');
		setTimeout(function (e) {
			$overlayWrapper.prop('hidden',true);
			$(document.body).removeClass('ovHidden');
		}, 220);
	});

	function deleteRule (ruleElm,ruleType) {
		if (ruleElm.is('tr')) {
			ruleElm.addClass('fadeOutDown');
			setTimeout(function () {
				$tbody = ruleElm.parent();
				ruleElm.remove();
				if ($tbody.find('tr').length === $tbody.find('input:checked').length) {
					$tbody.parent().find('thead input[type="checkbox"]').prop('checked',true);
				}
			}, 220);
		} else if (ruleElm.is('tbody')) {
			$overlayWrapper = $('#overlay-wrapper');
			$overlayWrapper.removeClass('fadeOutUp');
			$(document.body).addClass('ovHidden');
			$overlayWrapper.prop('hidden',false);
			$overlayWrapper.addClass('fadeInDown');
		} else {
			alert('Rong....')
		}
	}

});