/**
 * @license
 * Copyright 2012 Ben Sigelman (bhs@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 */

var FTV = function(canvas_name, data, options) {
  c = document.getElementById(canvas_name);
  ctx = c.getContext('2d');
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (var i = 0; i <= 200; i += 10) {
    ctx.lineTo(i, Math.sin(Math.PI * 2 * i / 200) * 100 + 100);
  }
  ctx.stroke();
};

FTV.NAME = "FTV";
FTV.VERSION = "0.1";

FTV.toString = function() {
  return "<" + this.NAME + " " + this.VERSION + ">";
};
