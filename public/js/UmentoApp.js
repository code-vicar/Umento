(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('UmentoApp', ["jquery", "json2", "underscore", "backbone"], function($, JSON, _, Backbone) {
    var Home, HomeView;
    Home = (function(_super) {

      __extends(Home, _super);

      function Home() {
        return Home.__super__.constructor.apply(this, arguments);
      }

      Home.prototype.defaults = function() {
        return {
          'Display': $('#hdnStartVal').val(),
          'connected': false
        };
      };

      return Home;

    })(Backbone.Model);
    HomeView = (function(_super) {

      __extends(HomeView, _super);

      function HomeView() {
        return HomeView.__super__.constructor.apply(this, arguments);
      }

      HomeView.prototype.tagName = "div";

      HomeView.prototype.initialize = function() {
        return this.model.on('change', function() {
          return this.render();
        }, this);
      };

      HomeView.prototype.events = {
        'click button': function() {
          var txt;
          txt = $('#inVal').val();
          if (txt.length > 0 && (window.socket != null)) {
            return window.socket.emit('SetVal', {
              val: txt
            });
          }
        }
      };

      HomeView.prototype.render = function() {
        var template;
        template = _.template($("#HomeTemplate").html(), this.model.toJSON());
        return this.$el.html(template);
      };

      return HomeView;

    })(Backbone.View);
    return {
      bbHome: Home,
      bbHomeView: HomeView
    };
  });

}).call(this);
