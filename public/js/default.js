(function() {
  var ConnectedUsersAPI, HomeAPI, MessageAPI, ns;

  ns = window.Umento = window.Umento || {};

  HomeAPI = ns.require("/js/Home");

  MessageAPI = ns.require("/js/Message");

  ConnectedUsersAPI = ns.require("/js/ConnectedUsers");

  $(function() {
    var connectedUsers, connectedUsersView, home, homeView, messages, messagesView, seedData;
    ns.socket = io.connect("" + document.location.host + ":" + document.location.port, {
      'sync disconnect on unload': true
    });
    seedData = JSON.parse($("#hdnMessages").val());
    messages = new MessageAPI.Messages(seedData);
    messagesView = new MessageAPI.MessagesView({
      collection: messages
    });
    connectedUsers = new ConnectedUsersAPI.ConnectedUsers({});
    connectedUsersView = new ConnectedUsersAPI.ConnectedUsersView({
      model: connectedUsers
    });
    home = new HomeAPI.Home({});
    homeView = new HomeAPI.HomeView({
      el: $('.mainsection'),
      model: home,
      ConnectedUsersView: connectedUsersView,
      MessagesView: messagesView
    });
    ns.socket.on("connect", function() {
      return home.set({
        connected: true
      });
    });
    ns.socket.on("disconnect", function() {
      return home.set({
        connected: false
      });
    });
    ns.socket.on("connectedUsers", function(data) {
      return connectedUsers.set({
        count: data.count
      });
    });
    return ns.socket.on("chatMessage", function(data) {
      return messages.add(data);
    });
  });

}).call(this);
