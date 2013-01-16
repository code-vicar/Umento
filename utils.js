(function() {
  
  var cookieUtils = require('cookie');
  var signatureUtils = require('cookie-signature');
  
  exports.cookie = cookieUtils;
  exports.signature = signatureUtils;
  
  //copied verbatim from connect's utils library
  exports.parseSignedCookie = function(str, secret) {
    return 0 === str.indexOf('s:')
      ? signatureUtils.unsign(str.slice(2), secret)
      : str;
  };
  
})();