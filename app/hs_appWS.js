const API_PORT = 4012;
const PACKAGE_NAME = 'ws.app.hs';

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http, {
  cors: {
    origin: '*',
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

http.listen(API_PORT, () => {
  console.log('Init ' + PACKAGE_NAME + ' on ' + API_PORT);
  console.log('Access URL : ws://localhost:' + API_PORT);
});
