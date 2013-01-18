(function() {
  var Login, LoginView, UmView, exports, hideAccountForm, ns, showAccountForm, tmpLogin,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ns = window.Umento = window.Umento || {};

  UmView = ns.require("/js/UmView");

  tmpLogin = ns.require("/templates/Login.html");

  showAccountForm = function(view) {
    var acntForm;
    acntForm = $("#accountForm");
    view.$el.find("a span").html("Sign In");
    return acntForm.fadeIn("slow", function() {
      return acntForm.find("input").first().focus();
    });
  };

  hideAccountForm = function(view) {
    var acntForm;
    acntForm = $("#accountForm");
    view.$el.find("a span").html("Account");
    return acntForm.fadeOut("fast");
  };

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
      var view;
      _.bind(this.buttonActivate, this);
      _.bind(this.keepOpen, this);
      _.bind(this.startHide, this);
      _.bind(this.signInResult, this);
      view = this;
      ns.socket.on('login', function(data) {
        return view.signInResult(data);
      });
      this.model.on('change', function() {
        return this.render();
      }, this);
      return this.render();
    };

    LoginView.prototype.events = {
      'click .button': "buttonActivate",
      'keyup a': "buttonActivate",
      'focus input': "keepOpen",
      'blur input': "startHide"
    };

    LoginView.prototype.signInResult = function(data) {
      var msg;
      if (data.result) {
        return this.model.set("username", data.username);
      } else {
        msg = this.$el.find(".message");
        msg.html("Incorrect Sign In");
        return msg.fadeIn("fast", function() {
          return setTimeout(function() {
            return msg.fadeOut("fast");
          }, 1500);
        });
      }
    };

    LoginView.prototype.buttonActivate = function(e) {
      var targetElem, txt, upName, upPassword;
      if (e.type === 'keyup' && (e.which != null) && e.which !== 13) {
        return;
      }
      targetElem = $(e.target);
      if (targetElem.prop("tagName").toLowerCase() === "a") {
        targetElem = targetElem.find("span");
      }
      txt = targetElem.html();
      if (txt === "Account") {
        return showAccountForm(this);
      } else if (txt === "Sign In") {
        upName = $("#username").val();
        upPassword = $("#password").val();
        if ((ns.socket != null) && upName.length > 0 && upPassword.length > 0) {
          return ns.socket.emit("login", {
            username: upName,
            password: upPassword
          });
        }
      } else {

      }
    };

    LoginView.prototype.keepOpen = function() {
      if (this.displayTimeoutID != null) {
        return clearTimeout(this.displayTimeoutID);
      }
    };

    LoginView.prototype.startHide = function() {
      var view;
      view = this;
      if (this.displayTimeoutID != null) {
        clearTimeout(this.displayTimeoutID);
      }
      return this.displayTimeoutID = setTimeout(function() {
        return hideAccountForm(view);
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
