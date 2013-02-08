$ ->
  
  ns = window.Umento = window.Umento || {}
  
  Crafty = window.Crafty
  
  Crafty.init()
  
  logUpdate = (e)->
    console.log "loading update"
    console.log e
  
  logError = (e)->
    console.log "loading error"
    console.log e
    
  #gamestate
  gs = {}
  
  Crafty.scene "loading", ->
    
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
          gs = data
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

  Crafty.scene "main", ->
    
    #precomputed variables
    TILESIZE = 32
    PLAYERSPRITESIZE =
      w:36
      h:72
    MAXW = gs.w*TILESIZE
    MAXH = gs.h*TILESIZE
    viewportMidW = $(Crafty.stage.elem).width() / 2
    viewportMidH = $(Crafty.stage.elem).height() / 2
    playerHalfWidth = PLAYERSPRITESIZE.w / 2
    playerHalfHeight = PLAYERSPRITESIZE.h / 2
    
    adjust_size = ->
      $(window).on "resize", ->
        #recalculate viewport variables
        viewportMidW = $(Crafty.stage.elem).width() / 2
        viewportMidH = $(Crafty.stage.elem).height() / 2
    
    ###
    Crafty.c('LeftControls', {
      init:->
        @requires('Multiway')
        return
        
      leftControls:(speed)->
        @multiway speed,
          W: -90
          S: 90
          D: 0
          A: 180
        return @
    })
    ###
    
    Crafty.c('Human', {
      init:->
        @requires("SpriteAnimation, Collision, Grid")
        @animate("walk",0,0,4)
        
        @bind 'NewDirection', (direction)->
          #animate walking left
          if direction.x < 0
            @stop().animate("walk",15,-1) unless @isPlaying "walk"
          #animate walking right
          if direction.x > 0
            @stop().animate("walk",15,-1) unless @isPlaying "walk"
          #animate walking up
          if direction.y < 0
            @stop().animate("walk",15,-1) unless @isPlaying "walk"
          #animate walking down
          if direction.y > 0
            @stop().animate("walk",15,-1) unless @isPlaying "walk"
          #stop walking animation
          if not direction.x and not direction.y
            @reset()
            @draw()
        
        #check if there was a collision after each move event
        @bind 'Moved', (from)->
          if @hit('solid')
            @attr
              x:from.x
              y:from.y
          else
            playerMidX = @x + playerHalfWidth
            playerMidY = @y + playerHalfHeight
            
            if playerMidX > viewportMidW and (MAXW - playerMidX) > viewportMidW
              Crafty.viewport.scroll('_x', -(playerMidX - viewportMidW))
            
            if playerMidY > viewportMidH and (MAXH - playerMidY) > (viewportMidH)
              #console.log({py:playerMidY, vpy:viewportMidH, maxh:MAXH});
              Crafty.viewport.scroll('_y', -(playerMidY - viewportMidH))
              
        return
    })
    
    Crafty.sprite(TILESIZE,"/game/art/PathAndObjects.png",
    {
      grass:[1,11],
      log:[6,10],
      edge:[3,10]
    })
    
    Crafty.sprite(PLAYERSPRITESIZE.w, "/game/art/Player.png",
    {
      player:[0,0,1,2]
    })
    
    Crafty.audio.add
      lounge:["/game/sound/SomewhereSunny.mp3", "/game/sound/SomewhereSunny.ogg", "/game/sound/SomewhereSunny.wav"]
      
    Crafty.audio.play('lounge',-1,1)
    
    entityMap = []
        
    for ent in gs.entities
      posX = ent.x*TILESIZE
      posY = ent.y*TILESIZE
      #initialize the yaxis at this xaxis location
      entityMap[ent.x] = [] unless entityMap[ent.x]?
      entityMap[ent.x][ent.y] = [] unless entityMap[ent.x][ent.y]?
      entityMap[ent.x][ent.y].push(Crafty.e("2D, DOM, " + ent.entity).attr({x:posX, y:posY}))
    
    playerEnt = Crafty.e("2D, DOM, player, Human, Fourway").attr({x: TILESIZE, y: TILESIZE, z:10}).fourway(2)
    entityMap[1][1].push = playerEnt
  
  Crafty.scene "loading"
    