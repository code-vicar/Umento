(function() {

  $(function() {
    var Crafty, SPRITESIZE, ns;
    ns = window.Umento = window.Umento || {};
    Crafty = window.Crafty;
    Crafty.init();
    Crafty.background("green");
    SPRITESIZE = 32;
    Crafty.sprite(SPRITESIZE, '/game/art/PathAndObjects.png', {
      grass: [0, 0],
      grass2: [1, 0],
      grass3: [0, 1],
      grass4: [1, 1]
    });
    Crafty.e("2D, DOM, grass").attr({
      x: 0,
      y: 0
    });
    Crafty.e("2D, DOM, grass2").attr({
      x: SPRITESIZE,
      y: 0
    });
    Crafty.e("2D, DOM, grass2").attr({
      x: SPRITESIZE * 2,
      y: 0
    });
    Crafty.e("2D, DOM, grass3").attr({
      x: 0,
      y: SPRITESIZE
    });
    return Crafty.e("2D, DOM, grass4").attr({
      x: SPRITESIZE,
      y: SPRITESIZE
    });
  });

}).call(this);
