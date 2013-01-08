define 'UmentoApp', [
  "jquery"
  "json2"
  "underscore"
  "backbone"
  "text!../../templates/Home.html"
  "text!../../templates/Message.html"
  ], ($, JSON, _, Backbone, tmpHome, tmpMessage) ->

    class UmView extends Backbone.View
      assign: (view, selector) ->
        view.setElement(@$(selector)).render()

    class Message extends Backbone.Model

    class MessageView extends UmView
      tagName: "article"

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
      
      initialize: ->
        @collection.on 'change', ->
          @render
        , @

        @render()

      render: ->
        @$el.empty()
        @collection.each _.bind (message, index) ->
          mView = new MessageView model:message
          @$el.append(mView.el)
        , @
        
        return @

  
    class Home extends Backbone.Model
      defaults: ->
        'Display': $('#hdnStartVal').val()
        'connected': false

    class HomeView extends UmView
      tagName: "div"

      template: ->
        _.template tmpHome, @model.toJSON()

      initialize: (options) ->
        @MessagesView = options.MessagesView
        
        @model.on 'change', ->
          @render()
        , @

        @render()

      EmitVal: ->
        txt = $('#inVal').val()
        if txt.length > 0 and window.socket?
          window.socket.emit 'SetVal', val:txt

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

        @assign(@MessagesView, ".messages")

        return @

    UmView:UmView
    Message:Message
    MessageView:MessageView
    Messages:Messages
    MessagesView:MessagesView
    Home:Home
    HomeView:HomeView