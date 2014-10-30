ns = window.Umento = window.Umento || {}

#= require "socket.js"
#= require "Home.js"
#= require "Message.js"
#= require "ConnectedUsers.js"

socket = ns.socket
HomeAPI = ns.HomeAPI
MessageAPI = ns.MessageAPI
ConnectedUsersAPI = ns.ConnectedUsersAPI

$ ->
  #set up messages and connected users sub views
  seedData = JSON.parse $("#hdnMessages").val()
  messages = new MessageAPI.Messages seedData.reverse()
  messagesView = new MessageAPI.MessagesView collection:messages
  connectedUsers = new ConnectedUsersAPI.ConnectedUsers({});
  connectedUsersView = new ConnectedUsersAPI.ConnectedUsersView model:connectedUsers
  
  #main home view
  home = new HomeAPI.Home({})
  homeView = new HomeAPI.HomeView el:$('.mainsection'), model:home, ConnectedUsersView:connectedUsersView, MessagesView:messagesView
  
  checkConnection = ->
    if socket.socket.connected
      home.set 'connected', true
      clearInterval intervalID
  
  intervalID = setInterval checkConnection, 1500
  
  return