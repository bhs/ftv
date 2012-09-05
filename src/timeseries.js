/**
 * @fileoverview The Timeseries object encapsulates state about the raw sequence
 * <timestamp, value> pairs, as well as identification and stylistic
 * information.
 */

var assert = function(condition, message) {
  if (!condition) {
    console.error("Assertion failed: " + message);
  }
};

var Timeseries = function(name, timestamps, values) {
  assert(timestamps.length == values.length);
  // A way of verifying that these are Float64Arrays.
  assert(timestamps.BYTES_PER_ELEMENT == 8,
         "Only use Float64Arrays for Timeseries timestamps.");
  assert(values.BYTES_PER_ELEMENT == 8,
         "Only use Float64Arrays for Timeseries values.");
  this.name = name;
  this.timestamps = timestamps;
  this.values = values;
  this.color = "#000";
  this.timeHighlightHandler = null;

  this.timeRange = [Number.MAX_VALUE, Number.MIN_VALUE];
  this.valueRange = [Number.MAX_VALUE, Number.MIN_VALUE];
  for (var i = 0; i < timestamps.length; ++i) {
    // Update time range.
    if (timestamps[i] < this.timeRange[0])
      this.timeRange[0] = timestamps[i];
    if (timestamps[i] > this.timeRange[1])
      this.timeRange[1] = timestamps[i];

    // Update value range.
    if (!isNaN(values[i])) {
      if (values[i] < this.valueRange[0])
        this.valueRange[0] = values[i];
      if (values[i] > this.valueRange[1])
        this.valueRange[1] = values[i];
    }
  }
};

Timeseries.prototype.getPointIterator = function(startTime, endTime) {
  return new TimeseriesPointIterator(this, startTime, endTime);
};

Timeseries.prototype.toString = function() {
  return "Timeseries(name=" + this.name + ")";
};

Timeseries.prototype.setColor = function(col) {
  this.color = col;
};

Timeseries.prototype.getColor = function() {
  return this.color;
};

Timeseries.prototype.getTimeRange = function() {
  return this.timeRange;
};

Timeseries.prototype.getValueRange = function() {
  return this.valueRange;
};

Timeseries.prototype.render = function(ctx) {
  this.renderWithOptions(ctx, {"lineWidth": 1});
};

Timeseries.prototype.highlight = function() {
  var self = this;
  var ftv = this.tsSet.ftv;
  this.tsSet.ftv.replaceOverlay(function(ctx) {
    self.renderWithOptions(ctx, {"lineWidth": 3});
    // (dirty the entire canvas)
    return null;
  });
};

Timeseries.prototype.unhighlight = function() {
  var self = this;
  var ftv = this.tsSet.ftv;
  this.tsSet.ftv.replaceOverlay(null);
};

Timeseries.prototype.setTimeHighlightHandler = function(fn) {
  this.timeHighlightHandler = fn;
};

var getOpt_ = function(opts, name, def) {
  if (name in opts) {
    return opts[name];
  } else {
    return def;
  }
};

Timeseries.prototype.renderWithOptions = function(ctx, opts) {
  // TODO: verify that this doesn't cost too much (the refetching and
  // recomputation). And think about alternatives.
  var globalTimeRange = this.tsSet.ftv.getGlobalTimeRange();
  var valueRange = this.tsSet.getValueRange();
  var scale = [
      this.tsSet.ftv.width() / (globalTimeRange[1] - globalTimeRange[0]),
      // Note that these transform higher values to have lower y coordinates, as
      // an FTV user would expect.
      ftv.height() / (
          valueRange[0] - valueRange[1])];
  var translation = [
      globalTimeRange[0],
      valueRange[1]];

  // TODO: other visual properties
  ctx.strokeStyle = this.getColor();
  ctx.lineWidth = getOpt_(opts, "lineWidth", 1);
  ctx.beginPath();
  var lastPointValid = false;
  for (var pointIter = this.getPointIterator();
       !pointIter.done();
       pointIter.next()) {
    if (!pointIter.valid()) {
      lastPointValid = false;
      continue;
    }
    var x = (pointIter.time() - translation[0]) * scale[0];
    var y = (pointIter.value() - translation[1]) * scale[1];
    if (!lastPointValid) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    lastPointValid = true;
  }
  ctx.stroke();
};

var TimeseriesPointIterator = function(ts, startTime, endTime) {
  this.timestamps = ts.timestamps;
  this.values = ts.values;
  this.ts = ts;
  this.startTime = startTime;
  this.endTime = endTime;
  this.pos = 0;
  if (this.startTime) {
    while (this.pos < this.timestamps.length &&
           this.timestamps[this.pos] < startTime) {
      ++this.pos;
    }
  }
};

TimeseriesPointIterator.prototype.value = function() {
  return this.values[this.pos];
};

TimeseriesPointIterator.prototype.time = function() {
  return this.timestamps[this.pos];
};

TimeseriesPointIterator.prototype.valid = function() {
  return !isNaN(this.values[this.pos]);
};

TimeseriesPointIterator.prototype.next = function() {
  ++this.pos;
};

TimeseriesPointIterator.prototype.handleTimeHighlight = function() {
  if (this.ts.timeHighlightHandler) {
    var val = this.values[this.pos];
    if (isNaN(val)) {
      this.ts.timeHighlightHandler(this.timestamps[this.pos], null);
    } else {
      this.ts.timeHighlightHandler(this.timestamps[this.pos], val);
    }
  }
};

TimeseriesPointIterator.prototype.done = function() {
  // FIXME: write an assert function and figure out imports.
  if (this.endTime == null) {
    return this.pos >= this.timestamps.length;
  } else {
    return (this.pos >= this.timestamps.length ||
            this.timestamps[this.pos] >= this.endTime);
  }
};


////////////////////////////////////////////////////////////////////////////////
// TimeseriesSet:

var TimeseriesSet = function(timeseries_array, unit_name) {
  this.name = name;
  this.tsArray = timeseries_array;
  for (var i = 0; i < this.tsArray.length; ++i) {
    this.tsArray[i].tsSet = this;
  }
  this.computeRanges_();
  // TODO: add a setter for this, maybe?
  this.ftv = null;
};

TimeseriesSet.prototype.size = function() {
  return this.tsArray.length;
};

TimeseriesSet.prototype.timeseries = function(i) {
  return this.tsArray[i];
};

/** @private */
TimeseriesSet.prototype.computeRanges_ = function() {
  this.timeRange = [Number.MAX_VALUE, Number.MIN_VALUE];
  this.valueRange = [Number.MAX_VALUE, Number.MIN_VALUE];
  for (var i = 0; i < this.tsArray.length; ++i) {
    // compute aggregate timeRange.
    if (this.tsArray[i].getTimeRange()[0] < this.timeRange[0])
      this.timeRange[0] = this.tsArray[i].getTimeRange()[0];
    if (this.tsArray[i].getTimeRange()[1] > this.timeRange[1])
      this.timeRange[1] = this.tsArray[i].getTimeRange()[1];

    // compute aggregate valueRange.
    if (this.tsArray[i].getValueRange()[0] != null) {
      if (this.tsArray[i].getValueRange()[0] < this.valueRange[0])
        this.valueRange[0] = this.tsArray[i].getValueRange()[0];
      if (this.tsArray[i].getValueRange()[1] > this.valueRange[1])
        this.valueRange[1] = this.tsArray[i].getValueRange()[1];
    }
  }
};

TimeseriesSet.prototype.getTimeRange = function() {
  return this.timeRange;
};

TimeseriesSet.prototype.getValueRange = function() {
  return this.valueRange;
};

TimeseriesSet.prototype.getValueRange = function() {
  return this.valueRange;
};

TimeseriesSet.prototype.render = function(ctx) {
  for (var t = 0; t < this.size(); ++t) {
    // TODO: experiment with Path objects for cleanliness and performance.
    var ts = this.timeseries(t);
    this.timeseries(t).render(ctx, ftv);
  }
};
