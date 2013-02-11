ns = window.Umento = window.Umento || {}

Crafty = window.Crafty

ns.GameComponents = {}

ns.GameComponents.vars = {}

ns.GameComponents.load = ->
  Crafty.sprite ns.GameComponents.vars.TILESIZE, "/game/art/PathAndObjects.png",
    grass:[1,11],
    log:[6,10],
    edge:[3,10]
  
  Crafty.sprite ns.GameComponents.vars.PLAYERSPRITESIZE.w, "/game/art/Player.png",
    player:[0,0,1,2]
  
  Crafty.audio.add
    lounge:["/game/sound/SomewhereSunny.mp3", "/game/sound/SomewhereSunny.ogg", "/game/sound/SomewhereSunny.wav"]
    
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
          playerMidX = @x + ns.GameComponents.vars.playerHalfWidth
          playerMidY = @y + ns.GameComponents.vars.playerHalfHeight
          
          if playerMidX > ns.GameComponents.vars.viewportMidW and (ns.GameComponents.vars.MAXW - playerMidX) > ns.GameComponents.vars.viewportMidW
            Crafty.viewport.scroll('_x', -(playerMidX - ns.GameComponents.vars.viewportMidW))
          
          if playerMidY > ns.GameComponents.vars.viewportMidH and (ns.GameComponents.vars.MAXH - playerMidY) > ns.GameComponents.vars.viewportMidH
            Crafty.viewport.scroll('_y', -(playerMidY - ns.GameComponents.vars.viewportMidH))
            
      return
  })