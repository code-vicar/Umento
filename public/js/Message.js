(function() {
  var Message, MessageView, Messages, MessagesView, UmView, exports, ns, tmpMessage,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ns = window.Umento = window.Umento || {};

  UmView = ns.require("/js/UmView");

  tmpMessage = ns.require("/templates/Message.html");

  exports = {};

  Message = (function(_super) {

    __extends(Message, _super);

    function Message() {
      return Message.__super__.constructor.apply(this, arguments);
    }

    Message.prototype.defaults = function() {
      return {
        ts: moment().format("YYYY-MM-DDTHH:mm:ss"),
        nickname: "Guest",
        message: ""
      };
    };

    return Message;

  })(Backbone.Model);

  MessageView = (function(_super) {

    __extends(MessageView, _super);

    function MessageView() {
      return MessageView.__super__.constructor.apply(this, arguments);
    }

    MessageView.prototype.tagName = "article";

    MessageView.prototype.className = "message";

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

    MessagesView.prototype.AddOne = function(message) {
      var mView;
      mView = new MessageView({
        model: message
      });
      return this.$el.prepend(mView.el);
    };

    MessagesView.prototype.AddAll = function() {
      this.$el.empty();
      return this.collection.each(this.AddOne);
    };

    MessagesView.prototype.initialize = function() {
      this.AddOne = _.bind(this.AddOne, this);
      this.AddAll = _.bind(this.AddAll, this);
      this.collection.on('reset', this.AddAll);
      this.collection.on('add', this.AddOne);
      ns.socket.on("chatMessage", _.bind(function(data) {
        return this.collection.add(data);
      }, this));
      return this.render();
    };

    MessagesView.prototype.render = function() {
      this.AddAll();
      return this;
    };

    return MessagesView;

  })(UmView);

  exports.Message = Message;

  exports.MessageView = MessageView;

  exports.Messages = Messages;

  exports.MessagesView = MessagesView;

  return exports;

}).call(this);
