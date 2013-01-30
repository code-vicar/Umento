(function() {
  var ConnectedUsersAPI, HomeAPI, MessageAPI, ns;

  ns = window.Umento = window.Umento || {};

  HomeAPI = ns.require("/js/Home");

  MessageAPI = ns.require("/js/Message");

  ConnectedUsersAPI = ns.require("/js/ConnectedUsers");

  $(function() {
    var checkConnection, connectedUsers, connectedUsersView, home, homeView, intervalID, messages, messagesView, seedData;
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
    checkConnection = function() {
      if (ns.socket.socket.connected) {
        home.set('connected', true);
        return clearInterval(intervalID);
      }
    };
    intervalID = setInterval(checkConnection, 1500);
  });

}).call(this);
