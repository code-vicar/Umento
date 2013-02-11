
class Player
    constructor:(props)->
      #set up default properties
      @x = 0
      @y = 0
      @speed = 2
      @MaxHP = 20
      @CurrentHP = 20
      
      #create properties from the object passed to the constuctor
      for key,val of props
        if props.hasOwnProperty(key) and typeof val isnt 'Object' and typeof val isnt 'function' and typeof val isnt 'undefined' and val isnt null
          if @hasOwnProperty key 
            @[key] = val
          else
            Object.defineProperty this, key, Object.getOwnPropertyDescriptor(props, key)

    isEqual:(p2) ->
      return @id is p2.id
      
root = exports ? {}
if exports?
  return root = module.exports = Player
else
  ns = window.Umento = window.Umento or {}
  ns.Player = Player

return Player