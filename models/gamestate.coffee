class GameState
    constructor:(props)->
      #set up default properties
      @h = 0
      @w = 0
      @tilesize = 32
      @playerspritesize = 36
      @logs = 0
      @players = []
      @entities = []
      #create properties from the object passed to the constuctor
      for key,val of props
        if props.hasOwnProperty(key) and typeof val isnt 'Object' and typeof val isnt 'function' and typeof val isnt 'undefined' and val isnt null
          if @hasOwnProperty key 
            @[key] = val
          else
            Object.defineProperty this, key, Object.getOwnPropertyDescriptor(props, key)

    initialize:->
      if @w > 0 and @h > 0
        for x in [0..(@w-1)]
          for y in [0..(@h-1)]  
            @entities.push
              name:"grass"
              args:
                x:x*@tilesize
                y:y*@tilesize
            if x is @w-1 or x is 0 or y is @h-1 or y is 0
              @entities.push
                name:"edge"
                args:
                  x:x*@tilesize
                  y:y*@tilesize
            
        for log in [0...@logs]
          #randomly generate x and y positions
          x = (Math.floor(Math.random()*(@w-3))+1)
          y = (Math.floor(Math.random()*(@h-3))+1)
          @entities.push
            name:"log"
            args:
              x:x*@tilesize
              y:y*@tilesize
            
            
    playerInGame:(player) ->
      @players.some (p, index) ->
        return player.id is p.id

root = exports ? {}
if exports?
  return root = module.exports = GameState

return GameState