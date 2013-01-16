(function() {

  require.config({
    shim: {
      'jquery': {
        deps: [],
        exports: '$'
      },
      'underscore': {
        deps: ['json2', 'jquery'],
        exports: '_'
      },
      'backbone': {
        deps: ['underscore', 'json2', 'jquery'],
        exports: 'Backbone'
      },
      'moment': {
        deps: [],
        exports: 'moment'
      }
    }
  });

  require(["jquery", "modernizr", "UmentoApp"], function($, mod, um) {
    return $(function() {
      var connectedUsersView, home, homeView, messages, messagesView, seedData;
      window.socket = io.connect("" + document.location.host + ":" + document.location.port, {
        'sync disconnect on unload': true
      });
      seedData = JSON.parse($("#hdnMessages").val());
      messages = new um.Messages(seedData);
      messagesView = new um.MessagesView({
        collection: messages
      });
      home = new um.Home({});
      connectedUsersView = new um.ConnectedUsersView({
        model: home
      });
      homeView = new um.HomeView({
        el: $('.mainsection'),
        model: home,
        ConnectedUsersView: connectedUsersView,
        MessagesView: messagesView
      });
      socket.on("connect", function() {
        return home.set({
          connected: true
        });
      });
      socket.on("disconnect", function() {
        return home.set({
          connected: false
        });
      });
      socket.on("connectedUsers", function(data) {
        return home.set({
          connectedUsers: data.count
        });
      });
      return socket.on("chatMessage", function(data) {
        return messages.add(data);
      });
    });
  });

}).call(this);
