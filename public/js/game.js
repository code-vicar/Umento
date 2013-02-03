(function() {
  var mainScene;

  $(function() {
    var Crafty, ns;
    ns = window.Umento = window.Umento || {};
    Crafty = window.Crafty;
    Crafty.init();
    Crafty.background("green");
    return Crafty.load(["/game/art/PathAndObjects.png", "/game/art/Player.png", "/game/sound/SomewhereSunny.mp3", "/game/sound/SomewhereSunny.ogg", "/game/sound/SomewhereSunny.wav"], function() {
      return mainScene();
    });
  });

  mainScene = function() {
    var LOGS, SPRITESIZE, addLog, drawBackground, scenemap, x, _fn, _i, _ref;
    SPRITESIZE = 32;
    LOGS = 10;
    Crafty.c('LeftControls', {
      init: function() {
        this.requires('Multiway');
      },
      leftControls: function(speed) {
        this.multiway(speed, {
          W: -90,
          S: 90,
          D: 0,
          A: 180
        });
        return this;
      }
    });
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
            return this.stop();
          }
        });
        this.bind('Moved', function(from) {
          if (this.hit('solid')) {
            return this.attr({
              x: from.x,
              y: from.y
            });
          }
        });
      }
    });
    Crafty.sprite(SPRITESIZE, "/game/art/PathAndObjects.png", {
      grass: [1, 11],
      log: [6, 10],
      pot: [12, 11, 1, 2]
    });
    Crafty.sprite(36, "/game/art/Player.png", {
      player: [0, 0, 1, 2]
    });
    Crafty.audio.add({
      lounge: ["/game/sound/SomewhereSunny.mp3", "/game/sound/SomewhereSunny.ogg", "/game/sound/SomewhereSunny.wav"]
    });
    Crafty.audio.play('lounge', -1, 1);
    scenemap = {
      h: 0,
      w: 0,
      axis: []
    };
    scenemap.w = Math.ceil(Crafty.stage.elem.clientWidth / SPRITESIZE);
    scenemap.h = Math.ceil(Crafty.stage.elem.clientHeight / SPRITESIZE);
    drawBackground = function(xaxis, yaxis) {
      var posX, posY;
      posX = xaxis * SPRITESIZE;
      posY = yaxis * SPRITESIZE;
      if (scenemap.axis[xaxis] == null) {
        scenemap.axis[xaxis] = [];
      }
      if (scenemap.axis[xaxis][yaxis] == null) {
        scenemap.axis[xaxis][yaxis] = [];
      }
      return scenemap.axis[xaxis][yaxis].push(Crafty.e("2D, DOM, grass").attr({
        x: posX,
        y: posY
      }));
    };
    addLog = function() {
      var posX, posY, xaxis, yaxis;
      xaxis = Crafty.math.randomInt(0, scenemap.w - 1);
      yaxis = Crafty.math.randomInt(0, scenemap.h - 1);
      posX = xaxis * SPRITESIZE;
      posY = yaxis * SPRITESIZE;
      if (scenemap.axis[xaxis] == null) {
        scenemap.axis[xaxis] = [];
      }
      if (scenemap.axis[xaxis][yaxis] == null) {
        scenemap.axis[xaxis][yaxis] = [];
      }
      return scenemap.axis[xaxis][yaxis].push(Crafty.e("2D, DOM, log").attr({
        x: posX,
        y: posY
      }));
    };
    _fn = function(x) {
      var y, _j, _ref1, _results;
      _results = [];
      for (y = _j = 0, _ref1 = scenemap.h - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; y = 0 <= _ref1 ? ++_j : --_j) {
        _results.push(drawBackground(x, y));
      }
      return _results;
    };
    for (x = _i = 0, _ref = scenemap.w - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; x = 0 <= _ref ? ++_i : --_i) {
      _fn(x);
    }
    (function() {
      var logs, _results;
      logs = LOGS + 1;
      _results = [];
      while ((logs -= 1)) {
        _results.push(addLog());
      }
      return _results;
    })();
    return Crafty.e("2D, DOM, player, Human, LeftControls").attr({
      x: 0,
      y: 0,
      z: 10
    }).leftControls(1);
  };

}).call(this);
