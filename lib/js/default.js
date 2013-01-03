// Generated by CoffeeScript 1.4.0
(function() {
  var ViewModel;

  ViewModel = (function() {

    function ViewModel(socket) {
      var _this = this;
      this.socket = socket;
      this.Display = ko.observable();
      this.btnSetVal_Click = function() {
        var txt;
        txt = $("#inVal").val();
        if (txt.length > 0) {
          return _this.socket.emit("SetVal", {
            "val": txt
          });
        }
      };
      this.socket.on("ClientConnected", function(data) {
        return _this.Display(data.redisVal);
      });
      this.socket.on("DataChanged", function(data) {
        return _this.Display(data.redisVal);
      });
    }

    return ViewModel;

  })();

  $(function() {
    ko.ActiveModel = new ViewModel(io.connect("" + document.location.host + ":" + document.location.port));
    return ko.applyBindings(ko.ActiveModel);
  });

}).call(this);