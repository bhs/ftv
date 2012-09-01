/**
 * @fileoverview The Timeseries object encapsulates state about the raw sequence
 * <timestamp, value> pairs, as well as identification and stylistic
 * information.
 */

var Timeseries = function(name, timestamps, values) {
  this.name = name;
  this.timestamps = timestamps;
  this.values = values;
  this.color = "#000";

  this.timeRange = [Number.MAX_VALUE, Number.MIN_VALUE];
  this.valueRange = [Number.MAX_VALUE, Number.MIN_VALUE];
  for (var i = 0; i < timestamps.length; ++i) {
    // Update time range.
    if (timestamps[i] < this.timeRange[0])
      this.timeRange[0] = timestamps[i];
    if (timestamps[i] > this.timeRange[1])
      this.timeRange[1] = timestamps[i];

    // Update value range.
    if (values[i] != null) {
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

var TimeseriesPointIterator = function(ts, startTime, endTime) {
  this.timestamps = ts.timestamps;
  this.values = ts.values;
  this.startTime = startTime;
  this.endTime = endTime;
  this.pos = 0;
  if (this.startTime) {
    while (this.pos < this.timestamps.length &&
           this.timestamps[this.pos] > startTime) {
      ++this.pos;
    }
    console.log(this.pos);
  }
};

TimeseriesPointIterator.prototype.value = function() {
  return this.values[this.pos];
};

TimeseriesPointIterator.prototype.time = function() {
  return this.timestamps[this.pos];
};

TimeseriesPointIterator.prototype.valid = function() {
  return this.values[this.pos] != null;
};

TimeseriesPointIterator.prototype.next = function() {
  ++this.pos;
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
  this.ts_array = timeseries_array;
  this.computeRanges_();
};

TimeseriesSet.prototype.size = function() {
  return this.ts_array.length;
};

TimeseriesSet.prototype.timeseries = function(i) {
  return this.ts_array[i];
};

/** @private */
TimeseriesSet.prototype.computeRanges_ = function() {
  this.timeRange = [Number.MAX_VALUE, Number.MIN_VALUE];
  this.valueRange = [Number.MAX_VALUE, Number.MIN_VALUE];
  for (var i = 0; i < this.ts_array.length; ++i) {
    // compute aggregate timeRange.
    if (this.ts_array[i].getTimeRange()[0] < this.timeRange[0])
      this.timeRange[0] = this.ts_array[i].getTimeRange()[0];
    if (this.ts_array[i].getTimeRange()[1] > this.timeRange[1])
      this.timeRange[1] = this.ts_array[i].getTimeRange()[1];

    // compute aggregate valueRange.
    if (this.ts_array[i].getValueRange()[0] != null) {
      if (this.ts_array[i].getValueRange()[0] < this.valueRange[0])
        this.valueRange[0] = this.ts_array[i].getValueRange()[0];
      if (this.ts_array[i].getValueRange()[1] > this.valueRange[1])
        this.valueRange[1] = this.ts_array[i].getValueRange()[1];
    }
  }
};

TimeseriesSet.prototype.getTimeRange = function() {
  return this.timeRange;
};

TimeseriesSet.prototype.getValueRange = function() {
  return this.valueRange;
};

