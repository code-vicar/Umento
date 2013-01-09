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
      seedData = JSON.parse $("#hdnStartVal").val()
      messages = new um.Messages seedData.messages
      messagesView = new um.MessagesView collection:messages
      
      #window.messages = messages
      home = new um.Home({})
      connectedUsersView = new um.ConnectedUsersView model:home
      homeView = new um.HomeView el:$('.mainsection'), model:home, ConnectedUsersView:connectedUsersView, MessagesView:messagesView
      
      socket.on "connect", =>
        home.set connected: true
      
      socket.on "disconnect", =>
        home.set connected: false
        
      socket.on "connectedUsers", (data) =>
        home.set connectedUsers: data.count
      
      socket.on "chatMessage", (data) =>
        messages.add data