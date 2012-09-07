/**
 * @license
 * Copyright 2012 Ben Sigelman (bhs@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 *
 * @fileoverview The top-level FTV file, and home of the FTV prototype.
 */

var FTV = function(div_name) {
  this.ts_sets = [];
  this.div = document.getElementById(div_name);
  this.canvas = document.createElement("canvas");
  this.canvas.width = 600;
  this.canvas.height = 300;
  this.div.appendChild(document.createElement("p"));
  this.div.appendChild(this.canvas);
  this.ctx = this.canvas.getContext("2d");
};

FTV.prototype.addTimeseriesSet = function(ts_set) {
  ts_set.ftv = this;
  this.ts_sets[this.ts_sets.length] = ts_set;
  this.computeTimeRange_();
};

FTV.prototype.start = function() {
  this.draw();
  this.baseImage = this.ctx.getImageData(0, 0, this.width(), this.height());
  this.registerHandlers_();
};

/** @private */
FTV.prototype.computeTimeRange_ = function() {
  this.timeRange = [Number.MAX_VALUE, Number.MIN_VALUE];
  for (var i = 0; i < this.ts_sets.length; ++i) {
    if (this.ts_sets[i].getTimeRange()[0] < this.timeRange[0])
      this.timeRange[0] = this.ts_sets[i].getTimeRange()[0];
    if (this.ts_sets[i].getTimeRange()[1] > this.timeRange[1])
      this.timeRange[1] = this.ts_sets[i].getTimeRange()[1];
  }
};

FTV.prototype.getGlobalTimeRange = function() {
  return this.timeRange;
};

////////////////////////////////////////////////////////////////////////////////
// Rendering:

FTV.prototype.draw = function() {
  for (var s = 0; s < this.ts_sets.length; ++s) {
    this.ts_sets[s].render(this.ctx, this);
  }
};

////////////////////////////////////////////////////////////////////////////////
// Event handling:
FTV.prototype.registerHandlers_ = function() {
  this.previousOverlayBounds = null;
  this.canvas._ftv = this;
  this.canvas.addEventListener(
      "mousemove", function(evt) {
          evt.srcElement._ftv.mouseMove_(evt);
      },
      false);
  this.canvas.addEventListener(
      "mouseout", function(evt) {
          evt.srcElement._ftv.mouseOut_(evt);
      },
      false);
};

FTV.prototype.clearPreviousOverlay_ = function() {
  if (this.previousOverlayBounds != null) {
    this.ctx.putImageData(
        this.baseImage, 0, 0,
        this.previousOverlayBounds[0],
        this.previousOverlayBounds[1],
        this.previousOverlayBounds[2],
        this.previousOverlayBounds[3]);
  }
  this.previousOverlayBounds = null;
};

FTV.prototype.mouseOut_ = function(evt) {
  this.clearPreviousOverlay_();
};

FTV.prototype.replaceOverlay = function(cb) {
  this.clearPreviousOverlay_();
  if (cb != null) {
    var rval = cb(this.ctx);
    if (rval)
      this.previousOverlayBounds = rval;
    else
      this.previousOverlayBounds = [0, 0, this.width(), this.height()];
  }
};

FTV.prototype.drawPoints = function(ctx) {
  // TODO: reuse this code for non-focused graphs.
  // ctx.strokeWidth = 1;
  // ctx.strokeStyle = "rgb(128, 128, 128)";
  // ctx.beginPath();
  // ctx.moveTo(this.mouseOverX, 0);
  // ctx.lineTo(this.mouseOverX, this.height());
  // ctx.stroke();

  var scale = [
      this.width() / (this.timeRange[1] - this.timeRange[0]),
      null];
  var translation = [
      this.timeRange[0],
      null];
  var startTime = ((this.mouseOverX - 1) / scale[0]) + translation[0];
  var endTime = ((this.mouseOverX + 1) / scale[0]) + translation[0];
  var minX = this.width();
  var maxX = 0;
  for (var s = 0; s < this.ts_sets.length; ++s) {
    var ts_set = this.ts_sets[s];

    // Note that these transform higher values to have lower y coordinates, as
    // a user would expect.
    scale[1] = this.height() / (
        ts_set.getValueRange()[0] - ts_set.getValueRange()[1]);
    translation[1] = ts_set.getValueRange()[1];

    for (var t = 0; t < ts_set.size(); ++t) {
      // TODO: experiment with Path objects for cleanliness and performance.
      var ts = ts_set.timeseries(t);
      // TODO: other visual properties
      var pointIter = ts.getPointIterator(startTime, endTime);
      if (!pointIter.done()) {
        pointIter.handleTimeHighlight();
        if (pointIter.valid()) {
          var x = (pointIter.time() - translation[0]) * scale[0];
          if (x > maxX)
            maxX = x;
          if (x < minX)
            minX = x;
          var y = (pointIter.value() - translation[1]) * scale[1];
          ctx.strokeStyle = ts.getColor();
          ctx.fillStyle = ts.getColor();
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2, true);
          ctx.fill();
        }
      }
    }
  }

  return [minX - 2, 0, 4 + maxX - minX, this.height()];
};

FTV.prototype.mouseMove_ = function(evt) {
  var self = this;
  self.mouseOverX = evt.offsetX;
  this.replaceOverlay(function(ctx) { return self.drawPoints(ctx); });
};

////////////////////////////////////////////////////////////////////////////////
// Trivial things:
FTV.prototype.NAME = "FTV";
FTV.prototype.VERSION = "0.1";

FTV.prototype.toString = function() {
  return "<" + this.NAME + " " + this.VERSION + ">";
};

FTV.prototype.width = function() {
  return this.canvas.width;
};

FTV.prototype.height = function() {
  return this.canvas.height;
};

