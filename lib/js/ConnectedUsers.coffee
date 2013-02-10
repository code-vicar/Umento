ns = window.Umento = window.Umento || {}

#= require "socket.js"
#= require "UmView.js"
#= require "require.js"

socket = ns.socket
UmView = ns.UmView
tmpConUsers = ns.require "/templates/ConnectedUsers.html"

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
    
    socket.on "connectedUsers", _.bind((data) ->
      @model.set "count", data.count
    , @)
    
    @render()
    
  render: ->
    @$el.html @template()
    return @

ns.ConnectedUsersAPI = {}
ns.ConnectedUsersAPI.ConnectedUsers = ConnectedUsers
ns.ConnectedUsersAPI.ConnectedUsersView = ConnectedUsersView
return ns.ConnectedUsersAPI