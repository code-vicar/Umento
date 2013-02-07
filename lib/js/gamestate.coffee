
class GameState
    constructor:(props)->
      #set up default properties
      @h = 0
      @w = 0
      @logs = 0
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
              x:x
              y:y
              entity:'grass'
            if x is @w-1 or x is 0 or y is @h-1 or y is 0
              @entities.push
                x:x
                y:y
                entity:'edge, solid'
            
        for log in [0...@logs]
          #randomly generate x and y positions
          x = (Math.floor(Math.random()*(@w-3))+1)
          y = (Math.floor(Math.random()*(@h-3))+1)
          @entities.push
            x:x
            y:y
            entity:'log'
  
root = exports ? {}
if exports?
  return root = module.exports = GameState

return GameState