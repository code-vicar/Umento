ns = window.Umento = window.Umento || {}
ns.socket = io.connect "#{document.location.host}:#{document.location.port}", 'sync disconnect on unload':true