// Generated by CoffeeScript 1.10.0
var hasProp = {}.hasOwnProperty;

define(function(require) {
  var collection, getExtData, readFile, restoreExtData, save2File, version;
  collection = require('common/js/collection');
  version = '0.1';
  getExtData = function() {
    var k, ret, v;
    ret = {};
    for (k in localStorage) {
      if (!hasProp.call(localStorage, k)) continue;
      v = localStorage[k];
      ret[k] = v;
    }
    return ret;
  };
  restoreExtData = function(data) {
    var e, error, k, v;
    if (typeof data !== 'object') {
      try {
        data = JSON.parse(data);
      } catch (error) {
        e = error;
        return false;
      }
    }
    for (k in data) {
      v = data[k];
      localStorage.setItem(k, typeof v === 'string' ? v : String(v));
    }
    collection.initCollection();
    return true;
  };

  /**
   * save text into file
   * @param  {String|Object} text     content of the file
   * @param  {String} filename filename
   */
  save2File = function(text, filename) {
    var dom;
    if (typeof text === 'object') {
      text = JSON.stringify(text);
    } else {
      text = "" + text;
    }
    text = encodeURIComponent(text);
    dom = document.createElement('a');
    dom.setAttribute('href', 'data:text/plain;charset=utf-8,' + text);
    dom.setAttribute('download', filename);
    return dom.click();
  };
  readFile = function(f, done, fail) {
    var reader, size;
    size = f.size;
    if (size > 1024 * 1024 * 5) {
      alert('Are you kidding me? the config file is bigger than 5m!');
      fail('SIZE_OVERFLOW');
      return;
    }
    reader = new FileReader();
    reader.onload = function(e) {
      return done(e.target.result);
    };
    reader.onerror = function(e) {
      return fail(e.message);
    };
    return reader.readAsText(f);
  };
  return {
    readFile: readFile,
    getExtData: getExtData,
    restoreExtData: restoreExtData,
    save2File: save2File
  };
});


//# sourceMappingURL=data-maintain.js.map