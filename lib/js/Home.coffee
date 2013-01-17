ns = window.Umento = window.Umento || {}

UmView = ns.require "/js/UmView"
MessageAPI = ns.require "/js/Message"
tmpHome = ns.require "/templates/Home.html"
exports = {}
class Home extends Backbone.Model
  defaults: ->
    'connected': false
    
class HomeView extends UmView
  tagName: "div"

  template: ->
    _.template tmpHome, @model.toJSON()

  initialize: (options) ->
    @EmitVal = _.bind @EmitVal, @
    
    @ConnectedUsersView = options.ConnectedUsersView
    @MessagesView = options.MessagesView
    
    @model.on 'change:connected', ->
      @render()
    , @

    @render()

  EmitVal: ->
    nick = $("#nick").val()
    nPut = $("#inVal")
    txt = nPut.val()
    if txt.length > 0 and ns.socket?
      msg = ts:moment().format("YYYY-MM-DDTHH:mm:ss"), message:txt
      msg.nickname = nick if nick? and nick.length > 0
      
      ns.socket.emit 'chatMessage', msg
      @MessagesView.collection.add new MessageAPI.Message msg
      nPut.val("")

  events:
    'click a': (e) ->
      e.preventDefault()
      @EmitVal()
    'keypress': (e) ->
      if e.which is 13
        e.preventDefault()
        @EmitVal()

  render: ->
    @$el.html @template()

    @assign(@ConnectedUsersView, ".connectedUsers")
    @assign(@MessagesView, ".messages")

    return @

exports.Home = Home
exports.HomeView = HomeView
return exports
