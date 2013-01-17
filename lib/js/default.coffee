ns = window.Umento = window.Umento || {}

HomeAPI = ns.require "/js/Home"
MessageAPI = ns.require "/js/Message"
ConnectedUsersAPI = ns.require "/js/ConnectedUsers"

$ ->
  ns.socket = io.connect "#{document.location.host}:#{document.location.port}", 'sync disconnect on unload':true
  
  #set up messages and connected users sub views
  seedData = JSON.parse $("#hdnMessages").val()
  messages = new MessageAPI.Messages seedData
  messagesView = new MessageAPI.MessagesView collection:messages
  connectedUsers = new ConnectedUsersAPI.ConnectedUsers({});
  connectedUsersView = new ConnectedUsersAPI.ConnectedUsersView model:connectedUsers
  
  #main home view
  home = new HomeAPI.Home({})
  homeView = new HomeAPI.HomeView el:$('.mainsection'), model:home, ConnectedUsersView:connectedUsersView, MessagesView:messagesView
  
  ns.socket.on "connect", ->
    home.set connected: true
  
  ns.socket.on "disconnect", ->
    home.set connected: false
    
  ns.socket.on "connectedUsers", (data) ->
    connectedUsers.set count: data.count
  
  ns.socket.on "chatMessage", (data) ->
    messages.add data