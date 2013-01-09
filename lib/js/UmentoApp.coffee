define 'UmentoApp', [
  "jquery"
  "json2"
  "underscore"
  "backbone"
  "text!../../templates/Home.html"
  "text!../../templates/Message.html"
  "text!../../templates/ConnectedUsers.html"
  ], ($, JSON, _, Backbone, tmpHome, tmpMessage, tmpConUsers) ->

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

    class Home extends Backbone.Model
      defaults: ->
        'connected': false
        'connectedUsers': 0
        
    class ConnectedUsersView extends UmView
      tagName: "h1"
      
      template: ->
        _.template tmpConUsers, @model.toJSON()
        
      initialize: ->
        @model.on 'change:connectedUsers', ->
          @render()
        , @
        @render()
        
      render: ->
        @$el.html @template()
        return @

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
        nPut = $('#inVal') 
        txt = nPut.val()
        if txt.length > 0 and window.socket?
          msg = nickname:'', message:txt
          window.socket.emit 'chatMessage', msg
          @MessagesView.collection.add new Message msg
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

    UmView:UmView
    Message:Message
    MessageView:MessageView
    Messages:Messages
    MessagesView:MessagesView
    Home:Home
    ConnectedUsersView:ConnectedUsersView
    HomeView:HomeView