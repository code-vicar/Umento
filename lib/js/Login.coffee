ns = window.Umento = window.Umento || {}

UmView = ns.require "/js/UmView"
tmpLogin = ns.require "/templates/Login.html"

NEW = "New?"
CANCEL = "Cancel"
SIGNIN = "Sign In"
ACCOUNT = "Account"
CREATE = "Create"

showAccountForm = (view) ->
  acntForm = view.$el.find("#accountForm")
  view.$el.find("#btnLogin span").html(SIGNIN)
  #show the form
  acntForm.fadeIn "slow", ->
    acntForm.find("input").first().focus()
    view.$el.trigger("focusin")

hideAccountForm = (view) ->
  acntForm = view.$el.find("#accountForm")
  view.$el.find("#btnLogin span").html(ACCOUNT)
  #hide the form
  acntForm.fadeOut "fast"
  
enterCreateMode = (view) ->
  acntForm = view.$el.find("#accountForm")
  email = acntForm.find("fieldset[name=email]")
  btnNew = view.$el.find("#btnNew")
  btnLogin = view.$el.find("#btnLogin")
  btnNew.find("span").html(CANCEL)
  btnLogin.find("span").html(CREATE)
  email.fadeIn "slow"
  
exitCreateMode = (view) ->
  acntForm = view.$el.find("#accountForm")
  email = acntForm.find("fieldset[name=email]")
  btnNew = view.$el.find("#btnNew")
  btnLogin = view.$el.find("#btnLogin")
  btnNew.find("span").html(NEW)
  btnLogin.find("span").html(SIGNIN)
  email.fadeOut "slow"

exports = {}
class Login extends Backbone.Model
  defaults: ->
    username:""

class LoginView extends UmView
  tagName: "div"
  className:"login"

  template: ->
    _.template tmpLogin, @model.toJSON()

  initialize: ->
    _.bind @btnLoginActivate, @
    _.bind @btnNewActivate, @
    _.bind @keepOpen, @
    _.bind @startHide, @
    _.bind @signInResult, @
    _.bind @createResult, @
    _.bind @render, @
    view = @
    
    ns.socket.on 'login', (data) ->
      view.signInResult(data)
      
    ns.socket.on 'createAccount', (data) ->
      view.createResult(data)
    
    @model.on 'change', ->
      view.render()

    @render()
    
  events:
    'click #btnLogin': "btnLoginActivate"
    'keyup #btnLogin': "btnLoginActivate"
    'click #btnNew'  : "btnNewActivate"
    'keyup #btnNew'  : "btnNewActivate"
    'focusin'    : "keepOpen"
    'focusout'     : "startHide"
  
  signInResult: (data) ->
    if data.result
      #signed in
      @model.set "username", data.username
    else
      #show message
      msg = @$el.find(".message")
      msg.html("Incorrect Sign In")
      msg.fadeIn "fast", ->
        setTimeout ->
          msg.fadeOut "fast"
        , 1500
        
  createResult: (data) ->
    if data.result
      @model.set "username", data.username
    else
      msg = @$el.find(".message")
      msg.html("Could Not Create Account")
      msg.fadeIn "fast", ->
        setTimeout ->
          msg.fadeOut "fast"
        , 1500
  
  btnNewActivate: (e) ->
    return if e.type is 'keyup' and e.which? and e.which isnt 13
    targetElem = $(e.target)
    targetElem = targetElem.find("span") if targetElem.prop("tagName").toLowerCase() is "a"
    txt = targetElem.html()
    if txt is NEW
      enterCreateMode(@)
    else
      exitCreateMode(@)
  
  btnLoginActivate: (e) ->
    return if e.type is 'keyup' and e.which? and e.which isnt 13
    targetElem = $(e.target)
    targetElem = targetElem.find("span") if targetElem.prop("tagName").toLowerCase() is "a"
    txt = targetElem.html()
    if txt is ACCOUNT
      showAccountForm(@)
    else if txt is SIGNIN
      #sign in
      upName = $("#username").val()
      upPassword = $("#password").val()
      if ns.socket? and upName.length > 0 and upPassword.length > 0
        ns.socket.emit "login",
          username:upName
          password:upPassword
    else if txt is CREATE
      upName = $("#username").val()
      upEmail = $("#email").val()
      upPassword = $("#password").val()
      if ns.socket? and upName.length > 0 and upPassword.length > 0
        ns.socket.emit "createAccount",
          username:upName
          email:upEmail
          password:upPassword


  keepOpen: ->
    clearTimeout @displayTimeoutID if @displayTimeoutID?
    
  startHide: ->
    view = @
    #clear the timeout just in case, to avoid an unlikely memory leak scenario
    clearTimeout @displayTimeoutID if @displayTimeoutID?
    #set a 3sec timeout to hide the account form
    @displayTimeoutID = setTimeout ->
      hideAccountForm(view)
    , 3000

  render: ->
    @$el.html @template()
    return @
    
exports.Login = Login
exports.LoginView = LoginView
return exports