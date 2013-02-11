#= require "gamecomponents.js"
#= require "socket.js"

$ ->
  
  ns = window.Umento = window.Umento || {}
  
  socket = ns.socket
  
  #emitted after you attempt to join a game
  socket.on "joinGame", (data)->
    ns.gamestate.localPlayer = null
    if data.result
      ns.gamestate.localPlayer = data.player
      Crafty.e("2D, DOM, player, Human, Fourway").attr({x:ns.gamestate.localPlayer.x, y:ns.gamestate.localPlayer.y, z:10}).fourway(ns.gamestate.localPlayer.speed);

  #emitted each time actions are taken on the client and are sent to the server
  socket.on "serverCorrection", (data)->
  
  #emitted each time a new player joins the game
  socket.on "playerJoined", (data)->

  #emitted each time a player disconnects from the game
  socket.on "playerDisconnected", (data)->

  Crafty = window.Crafty
  
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
    
    for ent in ns.gamestate.entities
      Crafty.e("2D, DOM, " + ent.entity).attr({x:ent.x, y:ent.y})
    
    #load other players that are already in the game
    for player in ns.gamestate.players
      Crafty.e("2D, DOM, player").attr({x:player.x, y:player.y, z:10})
      
    #when the main scene starts, try to join the game
    socket.emit "joinGame", {}

  #set up the scenes in crafty
  Crafty.scene "loading", loading
  Crafty.scene "main", main

  #start the crafty engine
  Crafty.init()
  Crafty.scene "loading"
