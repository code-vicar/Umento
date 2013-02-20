###
entity signature
{
name:string, unique
clientcomponents:array of strings (list of components),
servercomponents:array of strings (list of components),
args, function, takes obj which contains the arguments to be used when creating the entity,
initclient: function, takes vanilla crafty engine, creates and returns entity using the crafty engine,
initserver: function, takes server crafty engine, creates and returns entity using the crafty engine
}
###

class GameEntities

    #expecting an array of entity objects
    constructor:(props)->
      @_entities = []
      
      #if we got entities in the constructor than add them to the list
      if props?
        for ent in props
          @add ent
      
      #Create the list of entities for this game
      @add
        name:"grass"
        clientcomponents:[
          "2D", "DOM", "grass"
        ]
        servercomponents:[
          
        ]
        args:(obj)->
          @_args=obj
          
        initclient: (Crafty)->
          Crafty.e(@clientcomponents.join(",")).attr({ x: @_args.x, y:@_args.y });
          
        initserver: (Crafty)->
          null
          
      @add
        name:"edge"
        clientcomponents:[
          "2D", "solid", "DOM", "edge"
        ]
        servercomponents:[
          "2D", "solid"
        ]
        args:(obj)->
          @_args=obj
          
        initclient: (Crafty)->
          Crafty.e(@clientcomponents.join(",")).attr({ x: @_args.x, y:@_args.y });
          
        initserver: (Crafty)->
          Crafty.e(@servercomponents.join(",")).attr({ x: @_args.x, y:@_args.y });
          
      @add
        name:"log"
        clientcomponents:[
          "2D", "solid", "DOM", "log"
        ]
        servercomponents:[
          "2D", "solid"
        ]
        args:(obj)->
          @_args=obj
          
        initclient: (Crafty)->
          Crafty.e(@clientcomponents.join(",")).attr({ x: @_args.x, y:@_args.y });
          
        initserver: (Crafty)->
          Crafty.e(@servercomponents.join(",")).attr({ x: @_args.x, y:@_args.y });
          
      @add
        name:"player"
        clientcomponents:[
          "2D", "Collision", "DOM", "player", "SpriteAnimation", "Human"
        ]
        servercomponents:[
          "2D", "Collision", "Fourway"
        ]
        args:(obj)->
          @_args=obj
          
        initclient: (Crafty)->
          playerEnt = Crafty.e(@clientcomponents.join(",")).attr({ x: @_args.x, y:@_args.y, z:10 })
          if @_args.otherplayer? and @_args.otherplayer
            #playerEnt.addComponent "RemoteControl"
            #playerEnt.remotecontrol @_args.speed
          else
            playerEnt.addComponent "Fourway"
            playerEnt.fourway @_args.speed
          return playerEnt
          
        initserver: (Crafty)->
          Crafty.e(@servercomponents.join(",")).attr({ x: @_args.x, y:@_args.y }).fourway(@_args.speed)

    has: (ent) ->
      @_entities.some (e, index) ->
          e.name is ent.name
            
    add: (ent) ->
      @_entities.push ent unless @has ent
      
    remove: (ent) ->
      if typeof ent is "string"
        for item, i in @_entities
          return @_entities.slice i, 1 if item.name is ent
      else
        idx = @_entities.indexOf ent
        unless idx is -1
          return @_entities.slice idx, 1
      return null

    removeAt: (idx) ->
      unless idx is -1 or idx >= @_entities.length
        @_entities.slice idx, 1
        
    get: (name) ->
      for ent in @_entities
        return ent if ent.name is name
      return null

root = exports ? {}
if exports?
  return root = module.exports = GameEntities
else
  ns = window.Umento = window.Umento or {}
  ns.GameEntities = GameEntities

return GameEntities