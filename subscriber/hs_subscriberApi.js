const API_PORT = 4002;
const PACKAGE_NAME = 'api.subscriber.hs';

var cors = require('cors');

var app = require('express')();
var bodyParser = require('body-parser');
var http = require('http').createServer(app);
var io = require('socket.io')(http, {
  maxHttpBufferSize: 1e8,
  pingTimeout: 30000,
  cors: {
    origin: '*',
  }
});
