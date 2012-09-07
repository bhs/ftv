#!/usr/bin/python

"""A server that sits on a port and returns timeseries in FTV format.

There is a single handler -- /ftv -- which takes three URL parameters.
 - num_series: the number of timeseries to return
 - num_points: the number of points to return per series
 - percent_missing: the percent of points per series which will be absent

By default, 1 series with 500 points (and none missing) is returned.

The encoding format is as described in the FTV documentation.
"""

import BaseHTTPServer
import math
import struct
import time
import urlparse


class FTVHandler(BaseHTTPServer.BaseHTTPRequestHandler):
  def do_GET(s):
    parsed_url = urlparse.urlparse(s.path)
    path, params = (parsed_url.path, urlparse.parse_qs(parsed_url.query))

    if path == "/ftv":
      num_series = int(params.setdefault('num_series', [1])[0])
      num_points = int(params.setdefault('num_points', [500])[0])
      percent_missing = float(params.setdefault('percent_missing', [0])[0])

      s.send_response(200)
      s.send_header('Content-type', 'application/octet-stream')
      s.end_headers()
      now_ms = int(time.time() * 1000)
      for i in xrange(num_series):
        s.wfile.write(struct.pack('<L', num_points))
        s.wfile.write(struct.pack('<L', num_points))
        for t in xrange(num_points):
          s.wfile.write(struct.pack('<d', now_ms - (num_points - t) * 100))
        for v in [math.sin(math.pi * 2 * (i * 2 + j) / num_points)
                  for j in xrange(num_points)]:
          s.wfile.write(struct.pack('<d', v))
    elif path == "/":
      s.send_response(200)
      s.send_header('Content-type', 'text/html')
      s.end_headers()
      with open("examples/remote_graphs.html") as f:
        s.wfile.write(f.read())
    elif path == "/ftv.js":
      s.send_response(200)
      s.send_header('Content-type', 'text/javascript')
      s.end_headers()
      with open("src/ftv.js") as f:
        s.wfile.write(f.read())
    elif path == "/timeseries.js":
      s.send_response(200)
      s.send_header('Content-type', 'text/javascript')
      s.end_headers()
      with open("src/timeseries.js") as f:
        s.wfile.write(f.read())
    elif path == "/wire_format.js":
      s.send_response(200)
      s.send_header('Content-type', 'text/javascript')
      s.end_headers()
      with open("src/wire_format.js") as f:
        s.wfile.write(f.read())
    else:
      s.send_response(404)
      s.send_header('Content-type', 'text/html')
      s.end_headers()
      s.wfile.write('Try "/" instead.')
      return



if __name__ == '__main__':
  httpd = BaseHTTPServer.HTTPServer(('', 10000), FTVHandler)
  try:
    httpd.serve_forever()
  except KeyboardInterrupt:
    pass
  httpd.server_close()
  print "(done)"
