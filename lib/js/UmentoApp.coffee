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
        
        @EmitVal = ->
          txt = $('#inVal').val()
          if txt.length > 0 and window.socket?
            window.socket.emit 'SetVal', val:txt
        
        @model.on 'change', ->
          @render()
        , @
        
      events:
        'click a': (e) ->
          e.preventDefault()
          @EmitVal()
        'keypress': (e) ->
          if e.which is 13
            e.preventDefault()
            @EmitVal()
    
      render: ->
        template = _.template $("#HomeTemplate").html(), @model.toJSON()
        @$el.html template
    
    bbHome:Home
    bbHomeView:HomeView