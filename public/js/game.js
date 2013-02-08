(function() {

  $(function() {
    var Crafty, gs, logError, logUpdate, ns;
    ns = window.Umento = window.Umento || {};
    Crafty = window.Crafty;
    Crafty.init();
    logUpdate = function(e) {
      console.log("loading update");
      return console.log(e);
    };
    logError = function(e) {
      console.log("loading error");
      return console.log(e);
    };
    gs = {};
    Crafty.scene("loading", function() {
      var LoadingTxt;
      Crafty.background("#000");
      LoadingTxt = Crafty.e("2D, DOM, Text").attr({
        w: 100,
        h: 20,
        x: 150,
        y: 120
      }).text("Loading").css({
        "color": "#FFF",
        "text-align": "center"
      });
      return Crafty.load(["/game/art/PathAndObjects.png", "/game/art/Player.png", "/game/sound/SomewhereSunny.mp3", "/game/sound/SomewhereSunny.ogg", "/game/sound/SomewhereSunny.wav"], function() {
        LoadingTxt.text("Requesting State");
        return $.ajax({
          url: "/gamestate.json",
          dataType: "json",
          success: function(data, textStatus, jqXHR) {
            gs = data;
            return Crafty.scene("main");
          },
          error: function(jqXHR, textStatus, errorThrown) {
            logError({
              jqXHR: jqXHR,
              textStatus: textStatus,
              errorThrown: errorThrown
            });
            return LoadingTxt.text("Error loading game state");
          }
        });
      }, function(e) {
        return logUpdate(e);
      }, function(e) {
        logError(e);
        return LoadingTxt.text("Error loading assets");
      });
    });
    Crafty.scene("main", function() {
      var MAXH, MAXW, PLAYERSPRITESIZE, TILESIZE, adjust_size, ent, entityMap, playerEnt, playerHalfHeight, playerHalfWidth, posX, posY, viewportMidH, viewportMidW, _i, _len, _ref;
      TILESIZE = 32;
      PLAYERSPRITESIZE = {
        w: 36,
        h: 72
      };
      MAXW = gs.w * TILESIZE;
      MAXH = gs.h * TILESIZE;
      viewportMidW = $(Crafty.stage.elem).width() / 2;
      viewportMidH = $(Crafty.stage.elem).height() / 2;
      playerHalfWidth = PLAYERSPRITESIZE.w / 2;
      playerHalfHeight = PLAYERSPRITESIZE.h / 2;
      adjust_size = function() {
        return $(window).on("resize", function() {
          viewportMidW = $(Crafty.stage.elem).width() / 2;
          return viewportMidH = $(Crafty.stage.elem).height() / 2;
        });
      };
      /*
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
      */

      Crafty.c('Human', {
        init: function() {
          this.requires("SpriteAnimation, Collision, Grid");
          this.animate("walk", 0, 0, 4);
          this.bind('NewDirection', function(direction) {
            if (direction.x < 0) {
              if (!this.isPlaying("walk")) {
                this.stop().animate("walk", 15, -1);
              }
            }
            if (direction.x > 0) {
              if (!this.isPlaying("walk")) {
                this.stop().animate("walk", 15, -1);
              }
            }
            if (direction.y < 0) {
              if (!this.isPlaying("walk")) {
                this.stop().animate("walk", 15, -1);
              }
            }
            if (direction.y > 0) {
              if (!this.isPlaying("walk")) {
                this.stop().animate("walk", 15, -1);
              }
            }
            if (!direction.x && !direction.y) {
              this.reset();
              return this.draw();
            }
          });
          this.bind('Moved', function(from) {
            var playerMidX, playerMidY;
            if (this.hit('solid')) {
              return this.attr({
                x: from.x,
                y: from.y
              });
            } else {
              playerMidX = this.x + playerHalfWidth;
              playerMidY = this.y + playerHalfHeight;
              if (playerMidX > viewportMidW && (MAXW - playerMidX) > viewportMidW) {
                Crafty.viewport.scroll('_x', -(playerMidX - viewportMidW));
              }
              if (playerMidY > viewportMidH && (MAXH - playerMidY) > viewportMidH) {
                return Crafty.viewport.scroll('_y', -(playerMidY - viewportMidH));
              }
            }
          });
        }
      });
      Crafty.sprite(TILESIZE, "/game/art/PathAndObjects.png", {
        grass: [1, 11],
        log: [6, 10],
        edge: [3, 10]
      });
      Crafty.sprite(PLAYERSPRITESIZE.w, "/game/art/Player.png", {
        player: [0, 0, 1, 2]
      });
      Crafty.audio.add({
        lounge: ["/game/sound/SomewhereSunny.mp3", "/game/sound/SomewhereSunny.ogg", "/game/sound/SomewhereSunny.wav"]
      });
      Crafty.audio.play('lounge', -1, 1);
      entityMap = [];
      _ref = gs.entities;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ent = _ref[_i];
        posX = ent.x * TILESIZE;
        posY = ent.y * TILESIZE;
        if (entityMap[ent.x] == null) {
          entityMap[ent.x] = [];
        }
        if (entityMap[ent.x][ent.y] == null) {
          entityMap[ent.x][ent.y] = [];
        }
        entityMap[ent.x][ent.y].push(Crafty.e("2D, DOM, " + ent.entity).attr({
          x: posX,
          y: posY
        }));
      }
      playerEnt = Crafty.e("2D, DOM, player, Human, Fourway").attr({
        x: TILESIZE,
        y: TILESIZE,
        z: 10
      }).fourway(2);
      return entityMap[1][1].push = playerEnt;
    });
    return Crafty.scene("loading");
  });

}).call(this);
