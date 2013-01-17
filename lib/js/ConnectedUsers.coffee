ns = window.Umento = window.Umento || {}

UmView = ns.require "/js/UmView"
tmpConUsers = ns.require "/templates/ConnectedUsers.html"

exports = {}
class ConnectedUsers extends Backbone.Model
  defaults: ->
    'count':0
    
class ConnectedUsersView extends UmView
  tagName: "h1"
  
  template: ->
    _.template tmpConUsers, @model.toJSON()
    
  initialize: ->
    @model.on 'change:count', ->
      @render()
    , @
    
    @render()
    
  render: ->
    @$el.html @template()
    return @
  
exports.ConnectedUsers = ConnectedUsers
exports.ConnectedUsersView = ConnectedUsersView
return exports