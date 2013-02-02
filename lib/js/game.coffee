$ ->
  
  ns = window.Umento = window.Umento || {}
  
  Crafty = window.Crafty
  
  Crafty.init()
  
  Crafty.background("green")
  
  SPRITESIZE = 32
  LOGS = 10
  Crafty.sprite(SPRITESIZE,'/game/art/PathAndObjects.png',
  {
    grass:[1,11],
    log:[6,10],
    pot:[12,11,1,2]
    
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
      
  Crafty.e("2D, DOM, pot, Fourway").attr({x: 0, y: 0}).fourway(5)