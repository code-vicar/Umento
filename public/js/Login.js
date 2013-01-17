(function() {
  var Login, LoginView, UmView, exports, ns, tmpLogin,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ns = window.Umento = window.Umento || {};

  UmView = ns.require("/js/UmView");

  tmpLogin = ns.require("/templates/Login.html");

  exports = {};

  Login = (function(_super) {

    __extends(Login, _super);

    function Login() {
      return Login.__super__.constructor.apply(this, arguments);
    }

    Login.prototype.defaults = function() {
      return {
        username: ""
      };
    };

    return Login;

  })(Backbone.Model);

  LoginView = (function(_super) {

    __extends(LoginView, _super);

    function LoginView() {
      return LoginView.__super__.constructor.apply(this, arguments);
    }

    LoginView.prototype.tagName = "div";

    LoginView.prototype.className = "login";

    LoginView.prototype.template = function() {
      return _.template(tmpLogin, this.model.toJSON());
    };

    LoginView.prototype.initialize = function() {
      _.bind(this.loginClick, this);
      _.bind(this.mouseIn, this);
      _.bind(this.mouseOut, this);
      this.model.on('change', function() {
        return this.render();
      }, this);
      return this.render();
    };

    LoginView.prototype.events = function() {
      return {
        'click #btnLogin': this.loginClick,
        'mouseleave #accountForm': this.mouseOut,
        'mouseenter #accountForm': this.mouseIn
      };
    };

    LoginView.prototype.loginClick = function() {
      $("#accountForm").fadeIn("slow");
      return this.mouseOut();
    };

    LoginView.prototype.mouseIn = function() {
      if (this.displayTimeoutID != null) {
        return clearTimeout(this.displayTimeoutID);
      }
    };

    LoginView.prototype.mouseOut = function() {
      return this.displayTimeoutID = setTimeout(function() {
        return $("#accountForm").fadeOut("fast");
      }, 3000);
    };

    LoginView.prototype.render = function() {
      this.$el.html(this.template());
      return this;
    };

    return LoginView;

  })(UmView);

  exports.Login = Login;

  exports.LoginView = LoginView;

  return exports;

}).call(this);
