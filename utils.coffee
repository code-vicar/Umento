cookieUtils = require 'cookie'
signatureUtils = require 'cookie-signature'

exports.cookie = cookieUtils
exports.signature = signatureUtils

#copied verbatim from connect's utils library
exports.parseSignedCookie = (str, secret) ->
  if str.indexOf('s:') is 0 
    signatureUtils.unsign(str.slice(2), secret)
  else
    str