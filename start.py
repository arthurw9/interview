from http.server import BaseHTTPRequestHandler, HTTPServer, HTTPStatus
import os
import shutil
import webbrowser

"""The goal of this file is to allow server side actions such as rendering or
modifying PDF files with tools like pdftk. It's meant to replace start-local-web-server.sh.
TODO: Can PDF files be manipulated entirely on the client side? If so, then this file might
be unnecessary and we can just keep start-local-web-server.sh."""

hostname = "localhost"
port = 8000


def openBrowser():
  url = 'http://%s:%s/' % (hostname, port)
  chrome = webbrowser.get('chromium')
  chrome.open_new(url)


class MyRequestHandler(BaseHTTPRequestHandler):
  def serveFile(self, path):
    try:
      f = open(path, "rb")
    except OSError:
      self.send_error(HTTPStatus.NOT_FOUND, "File %s not found" % path)
      return
    self.send_response(HTTPStatus.OK)
    self.send_header("Content-type", "text/html")
    self.end_headers();
    if f:
      try:
        shutil.copyfileobj(f, self.wfile)
      finally:
        f.close()
    
  def do_GET(self):
    path = self.path.split('?',1)[0]
    path = path.split('#',1)[0]
    if path == "/" or path == "/index.html":
      self.serveFile("index.html")
    elif path == "/interview.js":
      self.serveFile("interview.js")
    elif path == "/test.html":
      self.serveFile("test.html")
    elif path == "/interview_test.js":
      self.serveFile("interview_test.js")
    else:
      self.send_error(HTTPStatus.NOT_FOUND, "[%s] was not found" % path)


def startServer():
  server = HTTPServer((hostname, port), MyRequestHandler)
  print("Server started at http://%s:%s" % (hostname, port))
  try:
    server.serve_forever()
  except KeyboardInterrupt:
    pass
  server.server_close()
  print("Server stopped.")


if __name__ == "__main__":
  startServer()
  # TODO: The browser doesn't open because startServer blocks.
  # openBrowser()
