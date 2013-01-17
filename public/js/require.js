(function() {
  var ns;

  ns = window.Umento = window.Umento || {};

  ns.requireCache = [];

  ns.require = function(urlOfSomeFile) {
    var cacheItem, dataType, moduleVal, result, _i, _len, _ref;
    dataType = null;
    if (urlOfSomeFile.indexOf(".html", urlOfSomeFile.length - 5) !== -1) {
      dataType = "text";
    } else {
      dataType = "script";
      if (urlOfSomeFile.indexOf(".js", urlOfSomeFile.length - 3) === -1) {
        urlOfSomeFile += ".js";
      }
    }
    _ref = ns.requireCache;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cacheItem = _ref[_i];
      if (cacheItem.url === urlOfSomeFile) {
        return cacheItem.val;
      }
    }
    result = jQuery.ajax({
      async: false,
      url: urlOfSomeFile,
      dataType: dataType
    });
    moduleVal = result.responseText;
    if (dataType === 'script') {
      moduleVal = eval(moduleVal);
    }
    ns.requireCache.push({
      url: urlOfSomeFile,
      val: moduleVal
    });
    return moduleVal;
  };

}).call(this);
