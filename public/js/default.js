(function() {

  require.config({
    shim: {
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
      var home, homeView,
        _this = this;
      window.socket = io.connect("" + document.location.host + ":" + document.location.port);
      home = new um.bbHome({});
      homeView = new um.bbHomeView({
        model: home
      });
      homeView.render();
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
