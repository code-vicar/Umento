require.config
  shim:
    'jquery':
      deps: []
      exports: '$'
    'underscore':
      deps: ['json2', 'jquery']
      exports: '_'
    'backbone':
      deps: ['underscore', 'json2', 'jquery']
      exports: 'Backbone'


require [
  "jquery"
  "modernizr"
  "UmentoApp"
  ], ($, mod, um) ->
    $ ->
      window.socket = io.connect "#{document.location.host}:#{document.location.port}"
      home = new um.bbHome({})
      homeView = new um.bbHomeView model:home
      
      homeView.render()
      $('#ph').html(homeView.el);
      
      socket.on "connect", =>
        home.set connected: true
      
      socket.on "disconnect", =>
        home.set connected: false
      
      socket.on "DataChanged", (data) =>
        home.set Display: data.val