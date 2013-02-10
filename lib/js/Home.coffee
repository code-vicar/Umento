ns = window.Umento = window.Umento || {}

#= require "socket.js"
#= require "UmView.js"
#= require "Message.js"
#= require "require.js"

socket = ns.socket
UmView = ns.UmView
MessageAPI = ns.MessageAPI

tmpHome = ns.require "/templates/Home.html"

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
    
    socket.on "connect", _.bind ->
      @model.set "connected", true
    , @
    
    socket.on "disconnect", _.bind ->
      @model.set "connected", false
    , @

    @render()

  EmitVal: ->
    nick = $("#nick").val()
    nPut = $("#inVal")
    txt = nPut.val()
    if txt.length > 0 and socket?
      msg = ts:moment().format("YYYY-MM-DDTHH:mm:ss"), message:txt
      msg.nickname = nick if nick? and nick.length > 0
      @MessagesView.collection.add new MessageAPI.Message msg
      msg.index = (@MessagesView.collection.length - 1)
      
      socket.emit 'chatMessage', msg
      
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
    
ns.HomeAPI = {}
ns.HomeAPI.Home = Home
ns.HomeAPI.HomeView = HomeView
return ns.HomeAPI
