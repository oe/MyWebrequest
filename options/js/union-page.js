// Generated by CoffeeScript 1.10.0
var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

define(function(require) {
  var UNION_PAGES, addRule, addSamleCustomRule4demo, checkCustomRule, collection, initSection, isRuleExists, isSafe4Qr, isUnionCat, removeRule, resetSectionCtrlsState, shouldShowDemoCsRule, showInputErrorInfo, tpl, utils, vars;
  utils = require('common/js/utils');
  collection = require('common/js/collection');
  tpl = require('js/tpl');
  vars = require('js/vars');
  UNION_PAGES = ['block', 'hotlink', 'hsts', 'log', 'custom'];
  isUnionCat = function(cat) {
    var ref;
    return ref = (cat || '').replace('#', ''), indexOf.call(UNION_PAGES, ref) >= 0;
  };
  isSafe4Qr = function(cat, rule) {
    if (cat !== 'block') {
      return true;
    }
    return !utils.isSubRule(rule, vars.QR_API_HOST);
  };

  /**
   * check whether a rule is covered by a wide range rule
   * when add a block or custome rule
   * @param  {String}  rule like *://abc.com/*
   * @return {String|undefined} if no block, return undefined, or the exist rule
   */
  isRuleExists = function(rule, cat) {
    var i, len1, r, rules;
    if (cat == null) {
      cat = 'block';
    }
    rules = collection.getRules(cat);
    for (i = 0, len1 = rules.length; i < len1; i++) {
      r = rules[i];
      if (utils.isSubRule(r, rule)) {
        return r;
      }
    }
  };

  /**
   * toggle enable state of section of cat( category )
   * @param  {String} cat
   */
  resetSectionCtrlsState = function(cat) {
    var $switch, $tbody, $thead, ruleNum, switchEnabled;
    $thead = $('#request-settings thead');
    $tbody = $('#request-settings tbody');
    ruleNum = $tbody.find('tr:not([nodata])').length;
    $switch = $('#request-settings .switch-input');
    switchEnabled = collection.getSwitch(cat);
    $switch.prop({
      'checked': switchEnabled && !!ruleNum,
      'disabled': !ruleNum
    });
    $('#request-settings .enable-tip').prop('hidden', !!ruleNum);
    $thead.find('input, button').prop('disabled', !ruleNum);
    $('#request-settings .rule-cunt-num').text(ruleNum);
    $thead.find('input').prop('checked', ruleNum && ruleNum === $tbody.find('tr input:checked').length);
  };
  removeRule = function(cat, $trs) {
    var $tbody, isRemoveAll, rules;
    $tbody = $('#request-settings tbody');
    if (!$trs) {
      $trs = $tbody.find('input:checked').parents('tr');
    }
    if (!$trs.length) {
      return;
    }
    rules = $trs.find('input').map(function() {
      return this.value;
    }).get();
    isRemoveAll = rules.length === $tbody.find('tr').length;
    collection.removeRule(cat, rules);
    $trs.addClass('fadeOutDown');
    setTimeout(function() {
      $trs.remove();
      if (isRemoveAll) {
        $tbody.html(tpl.nodataTpl);
      }
      resetSectionCtrlsState(cat);
    }, 200);
  };
  addRule = function(cat, rule) {
    var $tbody, $tr, noRule;
    $tbody = $('#request-settings tbody');
    $tr = $(tpl.rulesTpl([collection.getRule4Show(cat, rule)]));
    $tr.addClass('new-item');
    noRule = !$tbody.find('tr:not([nodata])').length;
    $tbody[noRule ? 'html' : 'prepend']($tr);
    $('.rule-field input').val('');
    if (cat === 'custom') {
      $('#custom-test-result').html('');
    }
    collection.addRule(cat, rule);
    resetSectionCtrlsState(cat);
    setTimeout(function() {
      $tr.removeClass('new-item');
    }, 600);
  };
  showInputErrorInfo = function($input, msg) {
    var $errorTip, $inputTip;
    $inputTip = $input.nextAll('.input-tip');
    if (!$inputTip.length) {
      return;
    }
    $errorTip = $inputTip.find('.error-info');
    clearTimeout($input.data('tid'));
    $input.data('tid', 0);
    if (!$errorTip.length) {
      $errorTip = $('<div/>', {
        'class': 'error-info'
      });
      $inputTip.prepend($errorTip);
    }
    $errorTip.html(msg);
    return $input.focus();
  };
  $('.input-tip').prevAll('input').on('keyup', function() {
    var $errorTip, $this, tid;
    $this = $(this);
    $errorTip = $this.nextAll('.input-tip').find('.error-info');
    if ($errorTip.length && !$this.data('tid')) {
      tid = setTimeout(function() {
        return $errorTip.remove();
      }, 2000);
      return $this.data('tid', tid);
    }
  });

  /**
   * init section of cat( category )
   * @param  {String} cat
   */
  initSection = function(cat) {
    var hasRule, html, isCustom, isHsts, rules;
    rules = collection.getRules4Show(cat);
    isCustom = cat === 'custom';
    $('#request-settings .js-custom').prop('hidden', !isCustom);
    $('#request-settings .js-not-custom').prop('hidden', isCustom);
    if (isCustom && shouldShowDemoCsRule()) {
      setTimeout(function() {
        return addSamleCustomRule4demo();
      }, 300);
    }
    rules.reverse();
    $('#fun-name').text($("#nav a[href^=#" + cat + "]").text());
    $('#fun-desc').text(utils.i18n("opt_" + cat + "_desc"));
    hasRule = !!rules.length;
    isHsts = cat === 'hsts';
    if (hasRule) {
      html = tpl.rulesTpl(rules);
    } else {
      html = tpl.nodataTpl;
      collection.setSwitch(cat, false);
    }
    $('#request-settings tbody').html(html);
    resetSectionCtrlsState(cat);
    $('#request-settings').attr('data-id', cat);
    $('#protocol').val(isHsts ? 'http' : '*').attr('disabled', isHsts);
  };
  $('#request-settings .switch-input').on('change', function(e) {
    var cat;
    cat = $('#request-settings').attr('data-id');
    collection.setSwitch(cat, this.checked);
  });
  $('#host').on('keyup', function(e) {
    var $path;
    if (e.keyCode === 13) {
      $path = $('#path');
      if ($path.val() === '') {
        $path.focus();
      } else {
        $(this).parents('.rule-field').find('.add-rule').click();
      }
    }
  });
  $('#host').on('paste', function(e) {
    var url;
    url = utils.getUrlFromClipboard(e);
    if (!(url.protocol && utils.isProtocol(url.protocol))) {
      return true;
    }
    if (!$('#protocol').prop('disabled')) {
      $('#protocol').val(url.protocol);
    }
    $('#host').val(url.host);
    $('#path').val(url.path + url.search);
    return false;
  });
  $('#path').on('keyup', function(e) {
    if (e.keyCode === 13) {
      $(this).parents('.rule-field').find('.add-rule').click();
      return false;
    }
  });
  $('.rule-field').on('click', '.add-rule', function(e) {
    var $host, $path, $protocol, cat, data, eMsg, megaRule, rule;
    cat = $('#request-settings').attr('data-id');
    $protocol = $('#protocol');
    $host = $("#host");
    $path = $("#path");
    data = {
      protocol: $protocol.val().trim(),
      host: $host.val().trim().toLowerCase(),
      path: $path.val().replace(/#.*$/, '').trim()
    };
    if (!utils.isProtocol(data.protocol)) {
      showInputErrorInfo($protocol, utils.i18n('opt_errtip_protocol'));
      $protocol.focus();
      return false;
    }
    if (!(data.host && (utils.isIp(data.host) || utils.isHost(data.host)))) {
      showInputErrorInfo($host, utils.i18n('opt_errtip_host'));
      $host.focus();
      return false;
    }
    if (data.path === '') {
      data.path = '*';
    }
    if (!(data.path && utils.isPath(data.path))) {
      showInputErrorInfo($path, utils.i18n('opt_errtip_path'));
      $path.focus();
      return false;
    }
    rule = data.protocol + "://" + data.host + "/" + data.path;
    if (rule.length > 500) {
      showInputErrorInfo($host, utils.i18n('opt_errtip_rulelong'));
      $host.focus();
      return false;
    }
    megaRule = isRuleExists(rule, cat);
    if (megaRule != null) {
      showInputErrorInfo($host, utils.i18n('opt_errtip_duplicate') + megaRule);
      $host.focus();
      return false;
    }
    if (data.host === '*') {
      if (['block', 'hsts'].indexOf(cat) !== -1) {
        eMsg = 'opt_errdlg_cstarqr';
      } else {
        eMsg = 'opt_errdlg_cstar';
      }
    } else {
      if (!isSafe4Qr(cat, rule)) {
        eMsg = 'opt_errdlg_cqr';
      }
    }
    if (eMsg) {
      dialog({
        title: utils.i18n('opt_errdlg_title'),
        content: utils.i18n(eMsg),
        cancelValue: utils.i18n('cancel_btn'),
        cancel: function() {},
        autofocus: false,
        okValue: utils.i18n('ok_btn'),
        ok: function() {
          addRule(cat, rule);
        }
      }).showModal();
      return;
    } else {
      addRule(cat, rule);
    }
  });
  $('#request-settings .multi-delete').on('click', function(e) {
    var cat, len;
    cat = $('#request-settings').attr('data-id');
    len = $(this).parents('table').find('tbody input:checked').length;
    if (len) {
      dialog({
        title: utils.i18n('opt_deldlg_title'),
        content: utils.i18n('opt_deldlg_content').replace('xx', len),
        cancelValue: utils.i18n('cancel_btn'),
        cancel: function() {},
        autofocus: false,
        okValue: utils.i18n('ok_btn'),
        ok: function() {
          removeRule(cat);
        }
      }).showModal();
    } else {
      dialog({
        content: utils.i18n('opt_errtip_nochose')
      }).show(this);
      return false;
    }
  });
  $('#request-settings tbody').on('click', '.delete', function(e) {
    var $tr, cat;
    $tr = $(this).parents('tr');
    cat = $('#request-settings').attr('data-id');
    removeRule(cat, $tr);
  });
  $('#check-all-rules').on('change', function(e) {
    var $table, $this, checked;
    $this = $(this);
    checked = $this.prop('checked');
    $table = $this.parents('.rules');
    $table.find('tbody input[type="checkbox"]').prop('checked', checked);
    $table.find('tbody tr')[checked ? 'addClass' : 'removeClass']('checked');
  });
  $('#request-settings tbody').on('change', 'input[type="checkbox"]', function(e) {
    var $checkAll, $tbody, $this, $tr;
    $this = $(this);
    $tr = $this.parents('tr');
    $tbody = $this.parents('tbody');
    $checkAll = $('#check-all-rules');
    if ($this.prop('checked')) {
      $tr.addClass('checked');
      if ($tbody.find('tr').length === $tbody.find('input:checked').length) {
        $checkAll.prop('checked', true);
      }
    } else {
      $tr.removeClass('checked');
      $checkAll.prop('checked', false);
    }
  });
  $('#host-c').on('paste', function(e) {
    var uri;
    uri = utils.getUrlFromClipboard(e);
    if (!(uri.protocol && utils.isProtocol(uri.protocol))) {
      return true;
    }
    if (!$('#protocol').prop('disabled')) {
      $('#protocol-c').val(uri.protocol);
    }
    $('#host-c').val(uri.raw.replace(uri.protocol + '://', ''));
    return false;
  });
  $('#host-c').on('keyup', function(e) {
    if (e.keyCode === 13) {
      $('#redirect-url-input').focus();
      return false;
    }
  });
  $('#redirect-url-input').on('keyup', function(e) {
    if (e.keyCode === 13) {
      $('#test-url-input').focus();
      return false;
    }
  });
  $('#test-url-input').on('keyup', function(e) {
    if (e.keyCode === 13) {
      $('#test-url-btn').click();
      return false;
    }
  });
  shouldShowDemoCsRule = function() {
    return !collection.getConfig('demo-custom-rule-showed');
  };

  /**
   * add a sample rule for user use it first time
   */
  addSamleCustomRule4demo = function() {
    var router;
    router = utils.getRouter('*://www.baidu.com/s?wd={kwd}', 'https://www.google.com.hk/search?q={kwd}');
    addRule('custom', router);
    collection.setConfig('demo-custom-rule-showed', true);
    return dialog({
      title: utils.i18n('opt_dlg_title'),
      content: utils.i18n('opt_custom_demotip'),
      okValue: utils.i18n('ok_btn'),
      ok: function() {}
    }).showModal();
  };

  /**
   * Test the custom rule with a real url
   * if pass return the rule object or nothing
   * @return {Object}
   *                 {
   *                    url: match url, which url will be captured used by chrome
   *                    reg: regexp string can match an url & extract params
   *                    matchUrl: match rule with placeholder, used by extension
   *                    redirectUrl: redirect rule with placeholder
   *                    hasQs: has named params in query string
   *                    params: two array of var name of each named param in path an querystring
   *                 }
   */
  checkCustomRule = function() {
    var $host, $protocol, $redirectUrl, $testUrl, host, matchUrl, megaRule, protocol, redirectUrl, ret, router, targetUrl, testUrl;
    $protocol = $('#protocol-c');
    $host = $('#host-c');
    $redirectUrl = $('#redirect-url-input');
    $testUrl = $('#test-csurl-input');
    protocol = $protocol.val();
    host = $host.val().trim();
    redirectUrl = $redirectUrl.val().trim();
    testUrl = $testUrl.val().trim();
    matchUrl = protocol + '://' + host;
    if (!utils.isProtocol(protocol)) {
      dialog({
        content: utils.i18n('opt_errtip_protocol')
      }).show($protocol[0]);
      return;
    }
    if (false === utils.isRouterStrValid(matchUrl)) {
      showInputErrorInfo($host, utils.i18n('opt_errtip_invalid_matchrule'));
      return;
    }
    router = utils.getRouter(matchUrl, redirectUrl);
    if (ret = utils.hasReservedWord(router)) {
      showInputErrorInfo($host, utils.i18n('opt_errtip_invalid_resvervedkwd') + ': ' + ret.join(','));
      return;
    }
    if (ret = utils.isKwdsUniq(router)) {
      showInputErrorInfo($host, utils.i18n('opt_errtip_invalid_duplicatedkwd') + ': ' + ret.join(','));
      return;
    }
    megaRule = isRuleExists(router.url, 'custom');
    if (megaRule != null) {
      showInputErrorInfo($host, utils.i18n('opt_errtip_duplicate') + megaRule);
    }
    if (!redirectUrl || !utils.isUrl(redirectUrl.replace(/\{\w+\}/g, 'xxx'))) {
      showInputErrorInfo($redirectUrl, utils.i18n('opt_errtip_invalid_redirectrule'));
      return;
    }
    if (ret = utils.hasUndefinedWord(router, redirectUrl)) {
      showInputErrorInfo($redirectUrl, utils.i18n('opt_errtip_invalid_undefinedkwd') + ': ' + ret.join(','));
      return;
    }
    if (!testUrl) {
      dialog({
        content: utils.i18n('opt_errtip_urlneedtest')
      }).show($testUrl[0]);
      return;
    }
    if (!utils.isUrl(testUrl)) {
      dialog({
        content: utils.i18n('opt_errtip_urlinvliad'),
        "with": 250
      }).show($testUrl[0]);
      return;
    }
    megaRule = isRuleExists(router.url, 'block');
    if (megaRule != null) {
      dialog({
        content: utils.i18n('opt_errtip_csconflictedblock') + ': ' + megaRule,
        okValue: utils.i18n('ok_btn'),
        ok: function() {}
      }).showModal();
      return;
    }
    targetUrl = utils.getTargetUrl(router, testUrl);
    $('#custom-test-result').html("<a target='_blank' href='" + (targetUrl || 'javascript:;') + "' class='" + (targetUrl ? '' : 'text-danger') + "'>" + (targetUrl || 'not match') + "</a>");
    if (targetUrl) {
      return router;
    }
  };
  $('#test-csurl-btn').on('click', function(e) {
    return checkCustomRule();
  });
  $('#add-csrule').on('click', function() {
    var router;
    router = checkCustomRule();
    if (!router) {
      return;
    }
    return addRule('custom', router);
  });
  return {
    init: initSection,
    isUnionCat: isUnionCat
  };
});


//# sourceMappingURL=union-page.js.map
