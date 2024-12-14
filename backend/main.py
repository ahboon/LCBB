import socketserver
import socket
import struct
import select
import threading
import jwt
import json
from flask import Flask, request, jsonify

SECRET_KEY = 'your-secret-key-hehe'

users = {
    "admin": "replacemeplease"
}

# In-memory cookie storage (replace with a database in production)
cookies = [
    {"user1": [{"name":"cookiename","value":"cookievalue","domain":"example.com","expirationDate":-62135596800,"path":"/","httpOnly":True,"secure":True,"session":True}]},
    {"user2": [{"name":"cookiename2","value":"cookievalue2","domain":"example2.com","expirationDate":-62135596800,"path":"/","httpOnly":True,"secure":True,"session":True}]}
]



class SocksProxy(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True

class SocksHandler(socketserver.StreamRequestHandler):
    def handle(self):
        # SOCKS5 initialization
        version, nmethods = self.connection.recv(2)
        methods = self.connection.recv(nmethods)

        # We'll use No Authentication Required (0x00)
        self.connection.sendall(struct.pack('BB', 5, 0))

        # Request
        version, cmd, _, address_type = self.connection.recv(4)

        if address_type == 1:  # IPv4
            address = socket.inet_ntoa(self.connection.recv(4))
        elif address_type == 3:  # Domain name
            domain_length = self.connection.recv(1)[0]
            address = self.connection.recv(domain_length).decode('utf-8')
        else:
            self.server.close_request(self.request)
            return

        port = struct.unpack('>H', self.connection.recv(2))[0]

        try:
            if cmd == 1:  # CONNECT
                remote = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                remote.connect((address, port))
                bind_address = remote.getsockname()
                print(f"Connected to {address}:{port}")
            else:
                self.server.close_request(self.request)
                return

            addr = struct.unpack("!I", socket.inet_aton(bind_address[0]))[0]
            port = bind_address[1]
            reply = struct.pack("!BBBBIH", 5, 0, 0, 1, addr, port)

        except Exception as err:
            print(err)
            reply = struct.pack("!BBBBIH", 5, 5, 0, 1, 0, 0)

        self.connection.sendall(reply)

        if reply[1] == 0 and cmd == 1:
            self.exchange_loop(self.connection, remote)

        self.server.close_request(self.request)

    def exchange_loop(self, client, remote):
        while True:
            r, w, e = select.select([client, remote], [], [])
            if client in r:
                data = client.recv(4096)
                if remote.send(data) <= 0:
                    break
            if remote in r:
                data = remote.recv(4096)
                if client.send(data) <= 0:
                    break

# Flask app
app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if username in users and users[username] == password:
        token = jwt.encode({'username': username}, SECRET_KEY, algorithm="HS256")
        return jsonify({'token': token, 'cookies': cookies})
    
    return jsonify({'error': 'Invalid credentials'}), 401

def run_flask():
    app.run(host='0.0.0.0', port=5000)

def run_socks():
    with SocksProxy(('0.0.0.0', 9011), SocksHandler) as server:
        print("SOCKS5 proxy server running on 127.0.0.1:9011")
        server.serve_forever()

if __name__ == '__main__':
    flask_thread = threading.Thread(target=run_flask)
    socks_thread = threading.Thread(target=run_socks)

    flask_thread.start()
    socks_thread.start()

    print("Flask server running on http://127.0.0.1:5000")
    print("SOCKS5 proxy server running on 127.0.0.1:9011")

    flask_thread.join()
    socks_thread.join()