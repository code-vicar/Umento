ns = window.Umento = window.Umento || {}

UmView = ns.require "/js/UmView"
tmpLogin = ns.require "/templates/Login.html"

showAccountForm = (view) ->
  acntForm = $("#accountForm")
  view.$el.find("a span").html("Sign In")
  #show the form
  acntForm.fadeIn "slow", ->
    acntForm.find("input").first().focus()

hideAccountForm = (view) ->
  acntForm = $("#accountForm")
  view.$el.find("a span").html("Account")
  #hide the form
  acntForm.fadeOut "fast"

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
    _.bind @buttonActivate, @
    _.bind @keepOpen, @
    _.bind @startHide, @
    _.bind @signInResult, @
    view = @
    
    ns.socket.on 'login', (data) ->
      view.signInResult(data)
    
    @model.on 'change', ->
      @render()
    , @

    @render()
    
  events:
    'click .button': "buttonActivate"
    'keyup a'      : "buttonActivate"
    'focus input'  : "keepOpen"
    'blur input'   : "startHide"
  
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
      
  buttonActivate: (e) ->
    return if e.type is 'keyup' and e.which? and e.which isnt 13
    targetElem = $(e.target)
    targetElem = targetElem.find("span") if targetElem.prop("tagName").toLowerCase() is "a"
    txt = targetElem.html()
    if txt is "Account"
      showAccountForm(@)
    else if txt is "Sign In"
      #sign in
      upName = $("#username").val()
      upPassword = $("#password").val()
      if ns.socket? and upName.length > 0 and upPassword.length > 0
        ns.socket.emit "login",
          username:upName
          password:upPassword
    else
      #sign out
        
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