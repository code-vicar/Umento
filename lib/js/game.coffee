#= require "entities.js"
#= require "gamecomponents.js"
#= require "socket.js"

$ ->
  
  Crafty = window.Crafty
  
  ns = window.Umento = window.Umento || {}
  
  GE = new ns.GameEntities()
  
  socket = ns.socket
  
  PlayerEntityTracker = []
  
  #emitted after you attempt to join a game
  socket.on "joinGame", (data)->
    if data.result
      playerGE = GE.get "player"
      playerGE.args
        x:data.player.x
        y:data.player.y
        speed:data.player.speed
      playerEnt = playerGE.initclient Crafty
      
      playerEnt.viewportFocusPlayer(true);
      
      ns.gamestate.localPlayer = player:data.player, playerEnt:playerEnt
  
  #emitted if there is an update to the game state caused by another player
  socket.on "gameUpdate", (playersUpdated)->
    for player in playersUpdated
      playerEnt = null
      PlayerEntityTracker.some (t, Index)->
        match = t.id is player.id
        if match
          playerEnt = t.playerEnt
        return match
        
      if playerEnt?
        playerEnt.x = player.x
        playerEnt.y = player.y
        
  #emitted each time actions are taken on the client and are sent to the server
  socket.on "serverCorrection", (correctionAndUpdates)->
    #splice off the top of the action buffer the actions which have been verified by the server
    ns.gamestate.localPlayer.playerEnt._actionbuffer.splice(0, correctionAndUpdates.actionsCorrect)
    #set the client to the corrected state given by the server
    
    #replay the list of actions in the buffer that are yet to be verified
  
  #emitted each time a new player joins the game
  socket.on "playerJoined", (data)->
    playerGE = GE.get "player"
    playerGE.args
      x:data.player.x
      y:data.player.y
      speed:data.player.speed
      otherplayer:true
    pEnt = playerGE.initclient Crafty
    PlayerEntityTracker.push
      id:data.player.id
      playerEnt: pEnt

  #emitted each time a player disconnects from the game
  socket.on "playerDisconnected", (data)->
    pID = data.player.id
    pIdx = -1
    ns.gamestate.players.some (p, idx)->
      match = p.id is pID
      if match
        pIdx = idx
      return match
    if pIdx >= 0
      ns.gamestate.players.splice(pIdx, 1)
    
    pEnt = null
    pEntIdx = -1
    PlayerEntityTracker.some (t, idx)->
      match = t.id is pID
      if match
        pEnt = t.playerEnt
        pEntIdx = idx
      return match
    if pEnt? and pEntIdx >= 0
      PlayerEntityTracker.splice(pEntIdx, 1)
      pEnt.destroy()
  
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
      ns.GameComponents.vars.viewportMidW = $(Crafty.stage.elem).width() / 2
      ns.GameComponents.vars.viewportMidH = $(Crafty.stage.elem).height() / 2
    
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
        x:p.x
        y:p.y
        speed:p.speed
        otherplayer:true
      pEnt = playerGE.initclient Crafty
      PlayerEntityTracker.push
        id:p.id
        playerEnt: pEnt
      
    #when the main scene starts, try to join the game
    socket.emit "joinGame", {}

  #set up the scenes in crafty
  Crafty.scene "loading", loading
  Crafty.scene "main", main

  #start the crafty engine
  Crafty.init()
  Crafty.scene "loading"
