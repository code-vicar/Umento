((exports)->

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
            
        for log in [0...@logs]
          #randomly generate x and y positions
          x = Math.floor(Math.random()*(@w-1))
          y = Math.floor(Math.random()*(@h-1))
          @entities.push
            x:x
            y:y
            entity:'log'
  
  if typeof window isnt 'undefined' and window isnt null
    exports = GameState
  else
    exports = module.exports = GameState
    
  return exports

)(if typeof exports is 'undefined' then {} else exports)