
#class definition
class ViewModel
  constructor: (socket) ->
    @socket = socket
    @Display = ko.observable()

    @btnSetVal_Click = =>
      txt = $("#inVal").val()
      if txt.length > 0
        @socket.emit "SetVal", "val": txt
  
    #initialize socket listeners
    @socket.on "ClientConnected", (data) =>
      @Display data.redisVal
    
    @socket.on "DataChanged", (data) =>
      @Display data.redisVal


$ ->
  ko.ActiveModel = new ViewModel io.connect "#{document.location.host}:#{document.location.port}"
  ko.applyBindings ko.ActiveModel