/**
 * @license
 * Copyright 2012 Ben Sigelman (bhs@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 *
 * @fileoverview The top-level FTV file, and home of the FTV prototype.
 */

var FTV = function(canvas_name) {
  this.ts_sets = [];
  this.canvas = document.getElementById(canvas_name);
  this.ctx = this.canvas.getContext("2d");
};

FTV.prototype.addTimeseriesSet = function(ts_set) {
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

////////////////////////////////////////////////////////////////////////////////
// Rendering:

FTV.prototype.draw = function() {
  // The value (as opposed to time) scale and translation is ts_set-specific.
  var scale = [
      this.width() / (this.timeRange[1] - this.timeRange[0]),
      null];
  var translation = [
      this.timeRange[0],
      null];
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
      this.ctx.strokeStyle = ts.getColor();
      this.ctx.beginPath();
      var lastPointValid = false;
      for (var pointIter = ts.getPointIterator();
           !pointIter.done();
           pointIter.next()) {
        if (!pointIter.valid()) {
          lastPointValid = false;
          continue;
        }
        var x = (pointIter.time() - translation[0]) * scale[0];
        var y = (pointIter.value() - translation[1]) * scale[1];
        if (!lastPointValid) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
        lastPointValid = true;
      }
      this.ctx.stroke();
    }
  }
};

////////////////////////////////////////////////////////////////////////////////
// Event handling:
FTV.prototype.registerHandlers_ = function() {
  this.mouseOverX = null;
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
  if (this.mouseOverX != null) {
    this.ctx.putImageData(
        this.baseImage, 0, 0, this.mouseOverX - 1, 0, 2, this.height());
  }
  this.mouseOverX = null;
};

FTV.prototype.mouseOut_ = function(evt) {
  this.clearPreviousOverlay_();
};

FTV.prototype.mouseMove_ = function(evt) {
  this.clearPreviousOverlay_();
  this.ctx.strokeWidth = 1;
  this.ctx.strokeStyle = "rgb(128, 128, 128)";
  this.ctx.beginPath();
  this.mouseOverX = evt.offsetX;
  this.ctx.moveTo(this.mouseOverX, 0);
  this.ctx.lineTo(this.mouseOverX, this.height());
  this.ctx.stroke();

  var scale = [
      this.width() / (this.timeRange[1] - this.timeRange[0]),
      null];
  var translation = [
      this.timeRange[0],
      null];
  var startTime = ((this.mouseOverX - 1) / scale[0]) + translation[0];
  var endTime = ((this.mouseOverX + 1) / scale[0]) + translation[0];
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
        var x = (pointIter.time() - translation[0]) * scale[0];
        var y = (pointIter.value() - translation[1]) * scale[1];
        this.ctx.strokeStyle = ts.getColor();
        this.ctx.beginPath();
        this.ctx.arc(x, y, 2, 0, Math.PI * 2, true);
        this.ctx.stroke();
      }
    }
  }
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

