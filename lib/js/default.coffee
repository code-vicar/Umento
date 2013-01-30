ns = window.Umento = window.Umento || {}

HomeAPI = ns.require "/js/Home"
MessageAPI = ns.require "/js/Message"
ConnectedUsersAPI = ns.require "/js/ConnectedUsers"

$ ->
  #set up messages and connected users sub views
  seedData = JSON.parse $("#hdnMessages").val()
  messages = new MessageAPI.Messages seedData
  messagesView = new MessageAPI.MessagesView collection:messages
  connectedUsers = new ConnectedUsersAPI.ConnectedUsers({});
  connectedUsersView = new ConnectedUsersAPI.ConnectedUsersView model:connectedUsers
  
  #main home view
  home = new HomeAPI.Home({})
  homeView = new HomeAPI.HomeView el:$('.mainsection'), model:home, ConnectedUsersView:connectedUsersView, MessagesView:messagesView
  
  checkConnection = ->
    if ns.socket.socket.connected
      home.set 'connected', true
      clearInterval intervalID
  
  intervalID = setInterval checkConnection, 1500
  
  return