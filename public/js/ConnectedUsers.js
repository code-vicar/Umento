(function() {
  var ConnectedUsers, ConnectedUsersView, UmView, exports, ns, tmpConUsers,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ns = window.Umento = window.Umento || {};

  UmView = ns.require("/js/UmView");

  tmpConUsers = ns.require("/templates/ConnectedUsers.html");

  exports = {};

  ConnectedUsers = (function(_super) {

    __extends(ConnectedUsers, _super);

    function ConnectedUsers() {
      return ConnectedUsers.__super__.constructor.apply(this, arguments);
    }

    ConnectedUsers.prototype.defaults = function() {
      return {
        'count': 0
      };
    };

    return ConnectedUsers;

  })(Backbone.Model);

  ConnectedUsersView = (function(_super) {

    __extends(ConnectedUsersView, _super);

    function ConnectedUsersView() {
      return ConnectedUsersView.__super__.constructor.apply(this, arguments);
    }

    ConnectedUsersView.prototype.tagName = "h1";

    ConnectedUsersView.prototype.template = function() {
      return _.template(tmpConUsers, this.model.toJSON());
    };

    ConnectedUsersView.prototype.initialize = function() {
      this.model.on('change:count', function() {
        return this.render();
      }, this);
      return this.render();
    };

    ConnectedUsersView.prototype.render = function() {
      this.$el.html(this.template());
      return this;
    };

    return ConnectedUsersView;

  })(UmView);

  exports.ConnectedUsers = ConnectedUsers;

  exports.ConnectedUsersView = ConnectedUsersView;

  return exports;

}).call(this);
