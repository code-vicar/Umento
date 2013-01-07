define 'UmentoApp', [
  "jquery"
  "json2"
  "underscore"
  "backbone"
  ], ($, JSON, _, Backbone) ->
  
    class Home extends Backbone.Model
      defaults: ->
        'Display': $('#hdnStartVal').val()
        'connected': false
    
    
    class HomeView extends Backbone.View
      tagName: "div"
      
      initialize: ->
        
        @model.on 'change', ->
          @render()
        , @
        
      events:
        'click button': ->
          txt = $('#inVal').val()
          if txt.length > 0 and window.socket?
            window.socket.emit 'SetVal', val:txt
    
      render: ->
        template = _.template $("#HomeTemplate").html(), @model.toJSON()
        @$el.html template
    
    bbHome:Home
    bbHomeView:HomeView