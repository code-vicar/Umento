#= require "socket.js"

ns = window.Umento = window.Umento || {}

Crafty = window.Crafty

socket = ns.socket

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
      @requires("SpriteAnimation, Collision")
      @animate("walk",0,0,4)
      
      @_actionbuffer = []
      self = @
      
      @_serverUpdate = setInterval ->
        unsent = (action for action in self._actionbuffer when action.sent is false)
        if unsent.length > 0
          socket.emit("gameUpdate", unsent)
          action.sent = true for action in unsent
      , 500
      
      @viewportFocusPlayer = (override)->
        playerMidX = @x + ns.GameComponents.vars.playerHalfWidth
        playerMidY = @y + ns.GameComponents.vars.playerHalfHeight
        
        
        if override
          #check the right side
          offsetx = ns.GameComponents.vars.viewportMidW - (ns.GameComponents.vars.MAXW - playerMidX)
          if offsetx > 0
            #couldnt fit the viewport between the player and the end of the map on the right, offset it to the left of the player
            offsetx = -offsetx
          else
            #check the left side
            offsetx = ns.GameComponents.vars.viewportMidW - playerMidX
            if offsetx < 0
              offsetx = 0
          #check the bottom side
          offsety = ns.GameComponents.vars.viewportMidH - (ns.GameComponents.vars.MAXH - playerMidY)
          if offsety > 0
            #couldnt fit the viewport between the player and the end of the map on the bottom, offset it to above the player
            offsety = -offsety
          else
            #check the top side
            offsety = ns.GameComponents.vars.viewportMidH - playerMidY
            if offsety < 0
              offsety = 0
          Crafty.viewport.scroll('_x', -(playerMidX - ns.GameComponents.vars.viewportMidW + offsetx))
          Crafty.viewport.scroll('_y', -(playerMidY - ns.GameComponents.vars.viewportMidH + offsety))

        else
          if (playerMidX > ns.GameComponents.vars.viewportMidW and (ns.GameComponents.vars.MAXW - playerMidX) > ns.GameComponents.vars.viewportMidW)
            Crafty.viewport.scroll('_x', -(playerMidX - ns.GameComponents.vars.viewportMidW))
          
          if (playerMidY > ns.GameComponents.vars.viewportMidH and (ns.GameComponents.vars.MAXH - playerMidY) > ns.GameComponents.vars.viewportMidH)
            Crafty.viewport.scroll('_y', -(playerMidY - ns.GameComponents.vars.viewportMidH))
      
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
          @viewportFocusPlayer false
            
        @_actionbuffer.push
          sent:false
          name:"move"
          args:
            x:@x
            y:@y
            from:
              from
            
      return
  })