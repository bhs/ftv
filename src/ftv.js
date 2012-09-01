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
};

FTV.prototype.addTimeseriesSet = function(ts_set) {
  this.ts_sets[this.ts_sets.length] = ts_set;
  this.computeTimeRange_();
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
  ctx = this.canvas.getContext("2d");
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
      // TODO: use the color, style, etc of the line.
      // TODO: experiment with Path objects for cleanliness and performance.
      ctx.beginPath();
      var last_point_valid = false;
      for (var point_iter = ts_set.timeseries(t).getPointIterator();
           !point_iter.done();
           point_iter.next()) {
        if (!point_iter.valid()) {
          last_point_valid = false;
          continue;
        }
        last_point_valid = true;
        var x = (point_iter.time() - translation[0]) * scale[0];
        var y = (point_iter.value() - translation[1]) * scale[1];
        if (!last_point_valid) {
          // START HERE: figure out why we're drawing through the gaps.
          ctx.stroke();
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
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

