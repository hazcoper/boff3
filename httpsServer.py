# taken from http://www.piware.de/2011/01/creating-an-https-server-in-python/
# generate server.xml with the following command:
#    openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes
# run as follows:
#    python simple-https-server.py
# then in your browser, visit:
#    https://localhost:4443

import BaseHTTPServer, SimpleHTTPServer
import ssl
import sys
import os


ip = '192.168.1.81'
port = 4440

folder = sys.argv[1]
print sys.argv[1]
os.chdir(os.path.join(os.getcwd(), folder))
print os.getcwd()
print ip, port

httpd = BaseHTTPServer.HTTPServer((ip, port), SimpleHTTPServer.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket (httpd.socket, certfile='./server.pem', server_side=True)
httpd.serve_forever()
