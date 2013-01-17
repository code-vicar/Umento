ns = window.Umento = window.Umento || {}

UmView = ns.require "/js/UmView"
tmpMessage = ns.require "/templates/Message.html"

exports = {}
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
    @render()

  render: ->
    @AddAll()
    return @

exports.Message = Message
exports.MessageView = MessageView
exports.Messages = Messages
exports.MessagesView = MessagesView
return exports