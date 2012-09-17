/**
 * @license
 * Copyright 2012 Ben Sigelman (bhs@gmail.com)
 * MIT-licensed (http://opensource.org/licenses/MIT)
 *
 * @fileoverview Decode the FTV TimeseriesSet wire format.
 */

var LoadRemoteTimeseriesSet = function(url, cb) {
  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.responseType = "arraybuffer";
  tsSet = null;
  req.onload = function(evt) {
    var arrayBuffer = evt.srcElement.response;
    if (arrayBuffer) {
      cb(DecodeTimeseriesSet(arrayBuffer));
    } else {
      cb(null);
    }
  }
  req.send(null);
};

var DecodeTimeseriesSet = function(arrayBuffer) {
  var pos = 0;
  var rval = [];
  while (pos < arrayBuffer.byteLength) {
    var dataView = new DataView(arrayBuffer);
    var tsLen = dataView.getUint32(pos, true);
    pos += 8;
    // FIXME/TODO: deal with the 32-vs-64 issue (we're writing two uint32s in
    // python -- terrible!)
    //
    // FIXME: must specify endianness in url param and do stuff server-side.
    var timestamps = new Float64Array(arrayBuffer, pos, tsLen);
    pos += 8 * tsLen;
    var values = new Float64Array(arrayBuffer, pos, tsLen);
    pos += 8 * tsLen;
    rval[rval.length] = new Timeseries(
        "series" + rval.length, timestamps, values);
  }
  return rval;
};
