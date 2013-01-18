(function() {
  var ConnectedUsersAPI, HomeAPI, MessageAPI, ns;

  ns = window.Umento = window.Umento || {};

  HomeAPI = ns.require("/js/Home");

  MessageAPI = ns.require("/js/Message");

  ConnectedUsersAPI = ns.require("/js/ConnectedUsers");

  $(function() {
    var connectedUsers, connectedUsersView, home, homeView, messages, messagesView, seedData;
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
    return homeView = new HomeAPI.HomeView({
      el: $('.mainsection'),
      model: home,
      ConnectedUsersView: connectedUsersView,
      MessagesView: messagesView
    });
  });

}).call(this);
