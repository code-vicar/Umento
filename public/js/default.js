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
      }
    }
  });

  require(["jquery", "modernizr", "UmentoApp"], function($, mod, um) {
    return $(function() {
      var home, homeView, messages, messagesView,
        _this = this;
      window.socket = io.connect("" + document.location.host + ":" + document.location.port);
      messages = new um.Messages([
        {
          nickname: 'Scott',
          message: 'Hi, my name is Scott'
        }, {
          nickname: '',
          message: 'anonymous message'
        }
      ]);
      messagesView = new um.MessagesView({
        collection: messages
      });
      home = new um.Home({});
      homeView = new um.HomeView({
        model: home,
        MessagesView: messagesView
      });
      $('#ph').html(homeView.el);
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
      return socket.on("DataChanged", function(data) {
        return home.set({
          Display: data.val
        });
      });
    });
  });

}).call(this);
