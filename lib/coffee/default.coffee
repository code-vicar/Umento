
#class definition
class ViewModel
  constructor: () ->
    @socket = null
    @connected = ko.observable false
    @Display = ko.observable $("#hdnStartVal").val()

    @btnSetVal_Click = =>
      txt = $("#inVal").val()
      if txt.length > 0 and @socket?
        @socket.emit "SetVal", "val":txt
        
            
    #initialize socket listeners
    @InitSocketIO = (socket) =>
      @socket = socket
      @socket.on "connect", =>
        @connected true
      
      @socket.on "disconnect", =>
        @connected false
      
      @socket.on "DataChanged", (data) =>
        @Display data.val

$ ->
  ko.ActiveModel = new ViewModel
  ko.ActiveModel.InitSocketIO io.connect "#{document.location.host}:#{document.location.port}"
  ko.applyBindings ko.ActiveModel