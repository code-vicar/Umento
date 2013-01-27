(function() {
  var ACCOUNT, CANCEL, CREATE, Login, LoginView, NEW, SIGNIN, UmView, enterCreateMode, exitCreateMode, exports, hideAccountForm, ns, showAccountForm, tmpLogin,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ns = window.Umento = window.Umento || {};

  UmView = ns.require("/js/UmView");

  tmpLogin = ns.require("/templates/Login.html");

  NEW = "New?";

  CANCEL = "Cancel";

  SIGNIN = "Sign In";

  ACCOUNT = "Account";

  CREATE = "Create";

  showAccountForm = function(view) {
    var acntForm;
    acntForm = view.$el.find("#accountForm");
    view.$el.find("#btnLogin span").html(SIGNIN);
    return acntForm.fadeIn("slow", function() {
      acntForm.find("input").first().focus();
      return view.$el.trigger("focusin");
    });
  };

  hideAccountForm = function(view) {
    var acntForm;
    acntForm = view.$el.find("#accountForm");
    view.$el.find("#btnLogin span").html(ACCOUNT);
    return acntForm.fadeOut("fast");
  };

  enterCreateMode = function(view) {
    var acntForm, btnLogin, btnNew, email;
    acntForm = view.$el.find("#accountForm");
    email = acntForm.find("fieldset[name=email]");
    btnNew = view.$el.find("#btnNew");
    btnLogin = view.$el.find("#btnLogin");
    btnNew.find("span").html(CANCEL);
    btnLogin.find("span").html(CREATE);
    return email.fadeIn("slow");
  };

  exitCreateMode = function(view) {
    var acntForm, btnLogin, btnNew, email;
    acntForm = view.$el.find("#accountForm");
    email = acntForm.find("fieldset[name=email]");
    btnNew = view.$el.find("#btnNew");
    btnLogin = view.$el.find("#btnLogin");
    btnNew.find("span").html(NEW);
    btnLogin.find("span").html(SIGNIN);
    return email.fadeOut("slow");
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
      _.bind(this.btnLoginActivate, this);
      _.bind(this.btnNewActivate, this);
      _.bind(this.keepOpen, this);
      _.bind(this.startHide, this);
      _.bind(this.signInResult, this);
      _.bind(this.createResult, this);
      _.bind(this.render, this);
      view = this;
      ns.socket.on('login', function(data) {
        return view.signInResult(data);
      });
      ns.socket.on('createAccount', function(data) {
        return view.createResult(data);
      });
      this.model.on('change', function() {
        return view.render();
      });
      return this.render();
    };

    LoginView.prototype.events = {
      'click #btnLogin': "btnLoginActivate",
      'keyup #btnLogin': "btnLoginActivate",
      'click #btnNew': "btnNewActivate",
      'keyup #btnNew': "btnNewActivate",
      'focusin': "keepOpen",
      'focusout': "startHide"
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

    LoginView.prototype.createResult = function(data) {
      var msg;
      if (data.result) {
        return this.model.set("username", data.username);
      } else {
        msg = this.$el.find(".message");
        msg.html("Could Not Create Account");
        return msg.fadeIn("fast", function() {
          return setTimeout(function() {
            return msg.fadeOut("fast");
          }, 1500);
        });
      }
    };

    LoginView.prototype.btnNewActivate = function(e) {
      var targetElem, txt;
      if (e.type === 'keyup' && (e.which != null) && e.which !== 13) {
        return;
      }
      targetElem = $(e.target);
      if (targetElem.prop("tagName").toLowerCase() === "a") {
        targetElem = targetElem.find("span");
      }
      txt = targetElem.html();
      if (txt === NEW) {
        return enterCreateMode(this);
      } else {
        return exitCreateMode(this);
      }
    };

    LoginView.prototype.btnLoginActivate = function(e) {
      var targetElem, txt, upEmail, upName, upPassword;
      if (e.type === 'keyup' && (e.which != null) && e.which !== 13) {
        return;
      }
      targetElem = $(e.target);
      if (targetElem.prop("tagName").toLowerCase() === "a") {
        targetElem = targetElem.find("span");
      }
      txt = targetElem.html();
      if (txt === ACCOUNT) {
        return showAccountForm(this);
      } else if (txt === SIGNIN) {
        upName = $("#username").val();
        upPassword = $("#password").val();
        if ((ns.socket != null) && upName.length > 0 && upPassword.length > 0) {
          return ns.socket.emit("login", {
            username: upName,
            password: upPassword
          });
        }
      } else if (txt === CREATE) {
        upName = $("#username").val();
        upEmail = $("#email").val();
        upPassword = $("#password").val();
        if ((ns.socket != null) && upName.length > 0 && upPassword.length > 0) {
          return ns.socket.emit("createAccount", {
            username: upName,
            email: upEmail,
            password: upPassword
          });
        }
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
