(function(){var a,b,c;return a=function(){function a(a){var b,c,d;this._entities=[];if(a!=null)for(c=0,d=a.length;c<d;c++)b=a[c],this.add(b);this.add({name:"grass",clientcomponents:["2D","DOM","grass"],servercomponents:[],args:function(a){return this._args=a},initclient:function(a){return a.e(this.clientcomponents.join(",")).attr({x:this._args.x,y:this._args.y})},initserver:function(a){return null}}),this.add({name:"edge",clientcomponents:["2D","solid","DOM","edge"],servercomponents:["2D","solid"],args:function(a){return this._args=a},initclient:function(a){return a.e(this.clientcomponents.join(",")).attr({x:this._args.x,y:this._args.y})},initserver:function(a){return a.e(this.servercomponents.join(",")).attr({x:this._args.x,y:this._args.y})}}),this.add({name:"log",clientcomponents:["2D","solid","DOM","log"],servercomponents:["2D","solid"],args:function(a){return this._args=a},initclient:function(a){return a.e(this.clientcomponents.join(",")).attr({x:this._args.x,y:this._args.y})},initserver:function(a){return a.e(this.servercomponents.join(",")).attr({x:this._args.x,y:this._args.y})}}),this.add({name:"player",clientcomponents:["2D","Collision","DOM","player","SpriteAnimation"],servercomponents:["2D","Collision","Fourway"],args:function(a){return this._args=a},initclient:function(a){var b;b=a.e(this.clientcomponents.join(",")).attr({x:this._args.x,y:this._args.y,z:10});if(this._args.otherplayer==null||!this._args.otherplayer)b.addComponent("Fourway"),b.addComponent("Human"),b.fourway(this._args.speed);return b},initserver:function(a){return a.e(this.servercomponents.join(",")).attr({x:this._args.x,y:this._args.y}).fourway(this._args.speed)}})}return a.prototype.has=function(a){return this._entities.some(function(b,c){return b.name===a.name})},a.prototype.add=function(a){if(!this.has(a))return this._entities.push(a)},a.prototype.remove=function(a){var b,c,d,e,f,g;if(typeof a=="string"){g=this._entities;for(b=e=0,f=g.length;e<f;b=++e){d=g[b];if(d.name===a)return this._entities.splice(b,1)}}else{c=this._entities.indexOf(a);if(c!==-1)return this._entities.splice(c,1)}return null},a.prototype.removeAt=function(a){if(!(a===-1||a>=this._entities.length))return this._entities.splice(a,1)},a.prototype.get=function(a){var b,c,d,e;e=this._entities;for(c=0,d=e.length;c<d;c++){b=e[c];if(b.name===a)return b}return null},a}(),c=typeof exports!="undefined"&&exports!==null?exports:{},typeof exports!="undefined"&&exports!==null?c=module.exports=a:(b=window.Umento=window.Umento||{},b.GameEntities=a,a)}).call(this),function(){var a;a=window.Umento=window.Umento||{},a.socket=io.connect("/",{"sync disconnect on unload":!0})}.call(this),function(){var a,b,c;b=window.Umento=window.Umento||{},a=window.Crafty,c=b.socket,b.GameComponents={},b.GameComponents.vars={},b.GameComponents.load=function(){return a.sprite(b.GameComponents.vars.TILESIZE,"/game/art/PathAndObjects.png",{grass:[1,11],log:[6,10],edge:[3,10]}),a.sprite(b.GameComponents.vars.PLAYERSPRITESIZE.w,"/game/art/Player.png",{player:[0,0,1,2]}),a.audio.add({lounge:["/game/sound/SomewhereSunny.mp3","/game/sound/SomewhereSunny.ogg","/game/sound/SomewhereSunny.wav"]}),a.c("Human",{init:function(){var d;this.requires("SpriteAnimation, Collision"),this.animate("walk",0,0,4),this._actionbuffer=[],d=this,this._serverUpdate=setInterval(function(){var a,b,e,f,g;b=function(){var b,c,e,f;e=d._actionbuffer,f=[];for(b=0,c=e.length;b<c;b++)a=e[b],a.sent===!1&&f.push(a);return f}();if(b.length>0){c.emit("gameUpdate",b),g=[];for(e=0,f=b.length;e<f;e++)a=b[e],g.push(a.sent=!0);return g}},500),this.viewportFocusPlayer=function(c){var d,e,f,g;f=this.x+b.GameComponents.vars.playerHalfWidth,g=this.y+b.GameComponents.vars.playerHalfHeight;if(c)return d=b.GameComponents.vars.viewportMidW-(b.GameComponents.vars.MAXW-f),d>0?d=-d:(d=b.GameComponents.vars.viewportMidW-f,d<0&&(d=0)),e=b.GameComponents.vars.viewportMidH-(b.GameComponents.vars.MAXH-g),e>0?e=-e:(e=b.GameComponents.vars.viewportMidH-g,e<0&&(e=0)),a.viewport.scroll("_x",-(f-b.GameComponents.vars.viewportMidW+d)),a.viewport.scroll("_y",-(g-b.GameComponents.vars.viewportMidH+e));f>b.GameComponents.vars.viewportMidW&&b.GameComponents.vars.MAXW-f>b.GameComponents.vars.viewportMidW&&a.viewport.scroll("_x",-(f-b.GameComponents.vars.viewportMidW));if(g>b.GameComponents.vars.viewportMidH&&b.GameComponents.vars.MAXH-g>b.GameComponents.vars.viewportMidH)return a.viewport.scroll("_y",-(g-b.GameComponents.vars.viewportMidH))},this.bind("NewDirection",function(a){a.x<0&&(this.isPlaying("walk")||this.stop().animate("walk",15,-1)),a.x>0&&(this.isPlaying("walk")||this.stop().animate("walk",15,-1)),a.y<0&&(this.isPlaying("walk")||this.stop().animate("walk",15,-1)),a.y>0&&(this.isPlaying("walk")||this.stop().animate("walk",15,-1));if(!a.x&&!a.y)return this.reset(),this.draw()}),this.bind("Moved",function(a){return this.hit("solid")?this.attr({x:a.x,y:a.y}):this.viewportFocusPlayer(!1),this._actionbuffer.push({sent:!1,name:"move",args:{x:this.x,y:this.y,from:a}})})}})}}.call(this),function(){$(function(){var a,b,c,d,e,f,g,h,i;return a=window.Crafty,h=window.Umento=window.Umento||{},b=new h.GameEntities,i=h.socket,c=[],i.on("joinGame",function(c){var d,e;if(c.result)return e=b.get("player"),e.args({x:c.player.x,y:c.player.y,speed:c.player.speed}),d=e.initclient(a),d.viewportFocusPlayer(!0),h.gamestate.localPlayer={player:c.player,playerEnt:d}}),i.on("gameUpdate",function(a){var b,d,e,f,g;g=[];for(e=0,f=a.length;e<f;e++)b=a[e],d=null,c.some(function(a,c){var e;return e=a.id===b.id,e&&(d=a.playerEnt),e}),d!=null?(d.x=b.x,g.push(d.y=b.y)):g.push(void 0);return g}),i.on("serverCorrection",function(a){return h.gamestate.localPlayer.playerEnt._actionbuffer.splice(0,a.actionsCorrect)}),i.on("playerJoined",function(d){var e,f;return f=b.get("player"),f.args({x:d.player.x,y:d.player.y,speed:d.player.speed,otherplayer:!0}),e=f.initclient(a),c.push({id:d.player.id,playerEnt:e})}),i.on("playerDisconnected",function(a){var b,d,e,f;e=a.player.id,f=-1,h.gamestate.players.some(function(a,b){var c;return c=a.id===e,c&&(f=b),c}),f>=0&&h.gamestate.players.splice(f,1),b=null,d=-1,c.some(function(a,c){var f;return f=a.id===e,f&&(b=a.playerEnt,d=c),f});if(b!=null&&d>=0)return c.splice(d,1),b.destroy()}),f=function(a){return console.log("loading update"),console.log(a)},e=function(a){return console.log("loading error"),console.log(a)},d=function(){var b;return a.background("#000"),b=a.e("2D, DOM, Text").attr({w:100,h:20,x:150,y:120}).text("Loading").css({color:"#FFF","text-align":"center"}),a.load(["/game/art/PathAndObjects.png","/game/art/Player.png","/game/sound/SomewhereSunny.mp3","/game/sound/SomewhereSunny.ogg","/game/sound/SomewhereSunny.wav"],function(){return b.text("Requesting State"),$.ajax({url:"/gamestate.json",dataType:"json",success:function(b,c,d){return h.gamestate=b,a.scene("main")},error:function(a,c,d){return e({jqXHR:a,textStatus:c,errorThrown:d}),b.text("Error loading game state")}})},function(a){return f(a)},function(a){return e(a),b.text("Error loading assets")})},g=function(){var d,e,f,g,j,k,l,m,n,o,p;h.GameComponents.vars={TILESIZE:h.gamestate.tilesize,PLAYERSPRITESIZE:{w:h.gamestate.playerspritesize,h:h.gamestate.playerspritesize*2},MAXW:h.gamestate.w*h.gamestate.tilesize,MAXH:h.gamestate.h*h.gamestate.tilesize,viewportMidW:$(a.stage.elem).width()/2,viewportMidH:$(a.stage.elem).height()/2,playerHalfWidth:h.gamestate.playerspritesize/2,playerHalfHeight:h.gamestate.playerspritesize},$(window).on("resize",function(){return h.GameComponents.vars.viewportMidW=$(a.stage.elem).width()/2,h.GameComponents.vars.viewportMidH=$(a.stage.elem).height()/2}),h.GameComponents.load(),a.audio.play("lounge",-1,1),o=h.gamestate.entities;for(k=0,m=o.length;k<m;k++)j=o[k],d=b.get(j.name),d.args(j.args),d.initclient(a);g=b.get("player"),p=h.gamestate.players;for(l=0,n=p.length;l<n;l++)e=p[l],g.args({x:e.x,y:e.y,speed:e.speed,otherplayer:!0}),f=g.initclient(a),c.push({id:e.id,playerEnt:f});return i.emit("joinGame",{})},a.scene("loading",d),a.scene("main",g),a.init(),a.scene("loading")})}.call(this)