ns = window.Umento = window.Umento || {}
#ns.socket = io.connect "#{document.location.hostname}:#{document.location.port}", 'sync disconnect on unload':true
ns.socket = io.connect "/", {'sync disconnect on unload':true}