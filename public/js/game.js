(function() {

  $(function() {
    var Crafty, LOGS, SPRITESIZE, addLog, drawBackground, ns, scenemap, x, _fn, _i, _ref;
    ns = window.Umento = window.Umento || {};
    Crafty = window.Crafty;
    Crafty.init();
    Crafty.background("green");
    SPRITESIZE = 32;
    LOGS = 10;
    Crafty.sprite(SPRITESIZE, '/game/art/PathAndObjects.png', {
      grass: [1, 11],
      log: [6, 10],
      pot: [12, 11, 1, 2]
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
    return Crafty.e("2D, DOM, pot, Fourway").attr({
      x: 0,
      y: 0
    }).fourway(5);
  });

}).call(this);
