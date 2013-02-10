ns = window.Umento = window.Umento || {}

#= require "socket.js"
#= require "UmView.js"
#= require "require.js"

socket = ns.socket
UmView = ns.UmView

tmpMessage = ns.require "/templates/Message.html"

class Message extends Backbone.Model
  defaults: ->
    ts:moment().format("YYYY-MM-DDTHH:mm:ss")
    nickname:"Guest"
    message:""

class MessageView extends UmView
  tagName: "article"
  className:"message"

  template: ->
    _.template tmpMessage, @model.toJSON()

  initialize: ->
    @model.on 'change', ->
      @render()
    , @

    @render()

  render: ->
    @$el.html @template()
    return @

class Messages extends Backbone.Collection
  model: Message
  url:"#"

class MessagesView extends UmView
  tagName: "section"
  
  AddOne: (message) ->
    mView = new MessageView model:message
    @$el.prepend(mView.el)
    
  AddAll: ->
    @$el.empty()
    @collection.each @AddOne
  
  initialize: ->
    @AddOne = _.bind @AddOne, @
    @AddAll = _.bind @AddAll, @
    
    @collection.on 'reset', @AddAll
    @collection.on 'add', @AddOne
    
    socket.on "chatMessage", _.bind((data) ->
      @collection.add data
    , @)
    
    socket.on "chatCorrection", _.bind((data) ->
      @collection.at(data.index).set("nickname",data.nickname)
    , @)
    
    @render()

  render: ->
    @AddAll()
    return @

ns.MessageAPI = {}
ns.MessageAPI.Message = Message
ns.MessageAPI.MessageView = MessageView
ns.MessageAPI.Messages = Messages
ns.MessageAPI.MessagesView = MessagesView
return ns.MessageAPI