$ ->
  
  ns = window.Umento = window.Umento || {}
  
  Crafty = window.Crafty;
  
  Crafty.init()
  
  Crafty.background("green");
  
  Crafty.e("2D, DOM, Color, Fourway").attr({w: 50, h: 50, x: 0, y: 0}).color("#EEE").fourway(5);