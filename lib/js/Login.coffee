ns = window.Umento = window.Umento || {}

UmView = ns.require "/js/UmView"
tmpLogin = ns.require "/templates/Login.html"
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
    _.bind @loginClick, @
    _.bind @mouseIn, @
    _.bind @mouseOut, @
    
    @model.on 'change', ->
      @render()
    , @

    @render()
    
  events: ->
    'click #btnLogin': @loginClick
      
    'mouseleave #accountForm': @mouseOut
    
    'mouseenter #accountForm': @mouseIn
      
  loginClick: ->
    $("#accountForm").fadeIn "slow"
    @mouseOut()
    
  mouseIn: ->
    clearTimeout @displayTimeoutID if @displayTimeoutID?
  mouseOut: ->
    @displayTimeoutID = setTimeout ->
      $("#accountForm").fadeOut "fast"
    , 3000

  render: ->
    @$el.html @template()
    return @
    
exports.Login = Login
exports.LoginView = LoginView
return exports