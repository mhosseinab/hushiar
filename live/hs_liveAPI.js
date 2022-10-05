const API_PORT = 4005;
const PACKAGE_NAME = 'api.live.hs';

var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
  next();
});
app.use(cors());

const managerFile = require('./hs_live.manager.js');
var manager = new managerFile({});

app.get('/isAlive', function(req,res){
  res.json({message:`${PACKAGE_NAME} is Alive!`});
});


function processSuccess(res, data){
  res.json(data);
}

function processError(res, err){
  console.log(err);
  res.status(400).json({message: err.message });
}

function checkAuth(req, res, callBack){
  var authId = req.headers.token || req.params.token;
  if(authId){
    manager.getAuthByAuthId(authId)
      .then(function(foundAuth){
        req.user = foundAuth.user;
        callBack();
      })
      .catch(function(err){
        console.log(err);
        res.status(403).json({
            message: 'Access Denied'
          });
      });
  }else{
    res.status(403).json({
        message: 'Access Denied'
      });
  }
}

app.listen(API_PORT,function(){
  console.log('Init ' + PACKAGE_NAME + ' on ' + API_PORT);
  console.log('Access URL : http://localhost:' + API_PORT);
});
