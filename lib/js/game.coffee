$ ->
  
  ns = window.Umento = window.Umento || {}
  
  Crafty = window.Crafty
  
  Crafty.init()
  
  updateLoading = (e)->
    console.log "loading update"
    console.log e
  
  alertError = (e)->
    alert "there was an error loading game assets"
    console.log "loading error"
    console.log e
  
  Crafty.scene "loading", ->
    
    #black background with some loading text
    Crafty.background "#000"
    Crafty.e("2D, DOM, Text").attr({ w: 100, h: 20, x: 150, y: 120 }).text("Loading").css({ "color":"#FFF", "text-align": "center" });
  
    Crafty.load [
      "/game/art/PathAndObjects.png"
      "/game/art/Player.png"
      "/game/sound/SomewhereSunny.mp3"
      "/game/sound/SomewhereSunny.ogg"
    ], ->
      Crafty.scene "main"
    , (e)->
      #progress function
      updateLoading e
    , (e)->
      #error function
      alertError e

  Crafty.scene "main", ->
    
    SPRITESIZE = 32
    LOGS = 10
    
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
            @stop()
        
        #check if there was a collision after each move event
        @bind 'Moved', (from)->
          if @hit('solid')
            @attr
              x:from.x
              y:from.y
        return
    })
    
    Crafty.sprite(SPRITESIZE,"/game/art/PathAndObjects.png",
    {
      grass:[1,11],
      log:[6,10],
      pot:[12,11,1,2]
    })
    Crafty.sprite(36,"/game/art/Player.png",
    {
      player:[0,0,1,2]
    })
    
    Crafty.audio.add
      lounge:["/game/sound/SomewhereSunny.mp3", "/game/sound/SomewhereSunny.ogg", "/game/sound/SomewhereSunny.wav"]
      
    Crafty.audio.play('lounge',-1,1)
    
    scenemap = { h:0, w:0, axis:[] }
    
    scenemap.w = Math.ceil(Crafty.stage.elem.clientWidth/SPRITESIZE)
    scenemap.h = Math.ceil(Crafty.stage.elem.clientHeight/SPRITESIZE)
    
    drawBackground = (xaxis, yaxis)->
      posX = xaxis*SPRITESIZE
      posY = yaxis*SPRITESIZE
      #initialize the yaxis at this xaxis location
      scenemap.axis[xaxis] = [] unless scenemap.axis[xaxis]?
      scenemap.axis[xaxis][yaxis] = [] unless scenemap.axis[xaxis][yaxis]?
      scenemap.axis[xaxis][yaxis].push(Crafty.e("2D, DOM, grass").attr({x:posX,y:posY}))
      
    addLog = ->
      xaxis = Crafty.math.randomInt(0,(scenemap.w-1))
      yaxis = Crafty.math.randomInt(0,(scenemap.h-1))
      posX = xaxis*SPRITESIZE
      posY = yaxis*SPRITESIZE
      scenemap.axis[xaxis] = [] unless scenemap.axis[xaxis]?
      scenemap.axis[xaxis][yaxis] = [] unless scenemap.axis[xaxis][yaxis]?
      scenemap.axis[xaxis][yaxis].push(Crafty.e("2D, DOM, log").attr({x:posX,y:posY}))
        
    for x in [0..(scenemap.w-1)]
      do (x) ->
        drawBackground x,y for y in [0..(scenemap.h-1)]
    
    (->
      logs = LOGS+1
      addLog() while (logs -= 1)
    )()
    
    Crafty.e("2D, DOM, player, Human, LeftControls").attr({x: 0, y: 0, z:10}).leftControls(1)
  
  Crafty.scene "loading"
    