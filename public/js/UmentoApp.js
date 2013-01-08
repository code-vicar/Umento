(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define('UmentoApp', ["jquery", "json2", "underscore", "backbone", "text!../../templates/Home.html", "text!../../templates/Message.html"], function($, JSON, _, Backbone, tmpHome, tmpMessage) {
    var Home, HomeView, Message, MessageView, Messages, MessagesView, UmView;
    UmView = (function(_super) {

      __extends(UmView, _super);

      function UmView() {
        return UmView.__super__.constructor.apply(this, arguments);
      }

      UmView.prototype.assign = function(view, selector) {
        return view.setElement(this.$(selector)).render();
      };

      return UmView;

    })(Backbone.View);
    Message = (function(_super) {

      __extends(Message, _super);

      function Message() {
        return Message.__super__.constructor.apply(this, arguments);
      }

      return Message;

    })(Backbone.Model);
    MessageView = (function(_super) {

      __extends(MessageView, _super);

      function MessageView() {
        return MessageView.__super__.constructor.apply(this, arguments);
      }

      MessageView.prototype.tagName = "article";

      MessageView.prototype.template = function() {
        return _.template(tmpMessage, this.model.toJSON());
      };

      MessageView.prototype.initialize = function() {
        this.model.on('change', function() {
          return this.render();
        }, this);
        return this.render();
      };

      MessageView.prototype.render = function() {
        this.$el.html(this.template());
        return this;
      };

      return MessageView;

    })(UmView);
    Messages = (function(_super) {

      __extends(Messages, _super);

      function Messages() {
        return Messages.__super__.constructor.apply(this, arguments);
      }

      Messages.prototype.model = Message;

      Messages.prototype.url = "#";

      return Messages;

    })(Backbone.Collection);
    MessagesView = (function(_super) {

      __extends(MessagesView, _super);

      function MessagesView() {
        return MessagesView.__super__.constructor.apply(this, arguments);
      }

      MessagesView.prototype.tagName = "section";

      MessagesView.prototype.initialize = function() {
        this.collection.on('change', function() {
          return this.render;
        }, this);
        return this.render();
      };

      MessagesView.prototype.render = function() {
        this.$el.empty();
        this.collection.each(_.bind(function(message, index) {
          var mView;
          mView = new MessageView({
            model: message
          });
          return this.$el.append(mView.el);
        }, this));
        return this;
      };

      return MessagesView;

    })(UmView);
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

      HomeView.prototype.template = function() {
        return _.template(tmpHome, this.model.toJSON());
      };

      HomeView.prototype.initialize = function(options) {
        this.MessagesView = options.MessagesView;
        this.model.on('change', function() {
          return this.render();
        }, this);
        return this.render();
      };

      HomeView.prototype.EmitVal = function() {
        var txt;
        txt = $('#inVal').val();
        if (txt.length > 0 && (window.socket != null)) {
          return window.socket.emit('SetVal', {
            val: txt
          });
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
        this.assign(this.MessagesView, ".messages");
        return this;
      };

      return HomeView;

    })(UmView);
    return {
      UmView: UmView,
      Message: Message,
      MessageView: MessageView,
      Messages: Messages,
      MessagesView: MessagesView,
      Home: Home,
      HomeView: HomeView
    };
  });

}).call(this);
