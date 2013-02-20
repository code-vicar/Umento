#= require "entities.js"
#= require "gamecomponents.js"
#= require "socket.js"

$ ->
  
  Crafty = window.Crafty
  
  ns = window.Umento = window.Umento || {}
  
  GE = new ns.GameEntities()
  
  socket = ns.socket
  
  #emitted after you attempt to join a game
  socket.on "joinGame", (data)->
    if data.result
      playerGE = GE.get "player"
      playerGE.args
        x:data.player.x
        y:data.player.y
        speed:data.player.speed
      playerEnt = playerGE.initclient Crafty
      
      ns.gamestate.localPlayer = player:data.player, playerEnt:playerEnt

  #emitted each time actions are taken on the client and are sent to the server
  socket.on "serverCorrection", (data)->
  
  #emitted each time a new player joins the game
  socket.on "playerJoined", (data)->

  #emitted each time a player disconnects from the game
  socket.on "playerDisconnected", (data)->
  
  logUpdate = (e)->
    console.log "loading update"
    console.log e
  
  logError = (e)->
    console.log "loading error"
    console.log e
    
  loading = ->
    #black background with some loading text
    Crafty.background "#000"
    LoadingTxt = Crafty.e("2D, DOM, Text").attr({ w: 100, h: 20, x: 150, y: 120 }).text("Loading").css({ "color":"#FFF", "text-align": "center" })
  
    Crafty.load [
      "/game/art/PathAndObjects.png"
      "/game/art/Player.png"
      "/game/sound/SomewhereSunny.mp3"
      "/game/sound/SomewhereSunny.ogg"
      "/game/sound/SomewhereSunny.wav"
    ], ->
      LoadingTxt.text "Requesting State"
      $.ajax
        url:"/gamestate.json"
        dataType:"json"
        success:(data, textStatus, jqXHR)->
          ns.gamestate = data
          Crafty.scene "main"
        error:(jqXHR, textStatus, errorThrown)->
          logError
            jqXHR:jqXHR
            textStatus:textStatus
            errorThrown:errorThrown
          LoadingTxt.text "Error loading game state"
    , (e)->
      #progress function
      logUpdate e
    , (e)->
      #error function
      logError e
      LoadingTxt.text "Error loading assets"
    
  main = ->
    #precomputed variables
    ns.GameComponents.vars = 
      TILESIZE: ns.gamestate.tilesize
      PLAYERSPRITESIZE:
        w: ns.gamestate.playerspritesize
        h: ns.gamestate.playerspritesize*2
      MAXW: ns.gamestate.w*ns.gamestate.tilesize
      MAXH: ns.gamestate.h*ns.gamestate.tilesize
      viewportMidW: $(Crafty.stage.elem).width() / 2
      viewportMidH: $(Crafty.stage.elem).height() / 2
      playerHalfWidth: ns.gamestate.playerspritesize / 2
      playerHalfHeight: ns.gamestate.playerspritesize
    
    $(window).on "resize", ->
      #recalculate viewport variables on window resize
      precomps.viewportMidW = $(Crafty.stage.elem).width() / 2
      precomps.viewportMidH = $(Crafty.stage.elem).height() / 2
    
    #load components
    ns.GameComponents.load()
    
    Crafty.audio.play('lounge',-1,1)
    
    for rawEnt in ns.gamestate.entities
      ent = GE.get rawEnt.name
      ent.args rawEnt.args
      ent.initclient Crafty
    
    #load other players that are already in the game
    playerGE = GE.get "player"
    for p in ns.gamestate.players
      playerGE.args
        x:p.player.x
        y:p.player.y
        speed:p.player.speed
        otherplayer:true
      playerGE.initclient Crafty
      
    #when the main scene starts, try to join the game
    socket.emit "joinGame", {}

  #set up the scenes in crafty
  Crafty.scene "loading", loading
  Crafty.scene "main", main

  #start the crafty engine
  Crafty.init()
  Crafty.scene "loading"
