(function() {
  var Home, HomeView, MessageAPI, UmView, exports, ns, tmpHome,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ns = window.Umento = window.Umento || {};

  UmView = ns.require("/js/UmView");

  MessageAPI = ns.require("/js/Message");

  tmpHome = ns.require("/templates/Home.html");

  exports = {};

  Home = (function(_super) {

    __extends(Home, _super);

    function Home() {
      return Home.__super__.constructor.apply(this, arguments);
    }

    Home.prototype.defaults = function() {
      return {
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

    HomeView.prototype.template = function() {
      return _.template(tmpHome, this.model.toJSON());
    };

    HomeView.prototype.initialize = function(options) {
      this.EmitVal = _.bind(this.EmitVal, this);
      this.ConnectedUsersView = options.ConnectedUsersView;
      this.MessagesView = options.MessagesView;
      this.model.on('change:connected', function() {
        return this.render();
      }, this);
      return this.render();
    };

    HomeView.prototype.EmitVal = function() {
      var msg, nPut, nick, txt;
      nick = $("#nick").val();
      nPut = $("#inVal");
      txt = nPut.val();
      if (txt.length > 0 && (ns.socket != null)) {
        msg = {
          ts: moment().format("YYYY-MM-DDTHH:mm:ss"),
          message: txt
        };
        if ((nick != null) && nick.length > 0) {
          msg.nickname = nick;
        }
        ns.socket.emit('chatMessage', msg);
        this.MessagesView.collection.add(new MessageAPI.Message(msg));
        return nPut.val("");
      }
    };

    HomeView.prototype.events = {
      'click a': function(e) {
        e.preventDefault();
        return this.EmitVal();
      },
      'keypress': function(e) {
        if (e.which === 13) {
          e.preventDefault();
          return this.EmitVal();
        }
      }
    };

    HomeView.prototype.render = function() {
      this.$el.html(this.template());
      this.assign(this.ConnectedUsersView, ".connectedUsers");
      this.assign(this.MessagesView, ".messages");
      return this;
    };

    return HomeView;

  })(UmView);

  exports.Home = Home;

  exports.HomeView = HomeView;

  return exports;

}).call(this);
