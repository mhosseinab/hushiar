const API_PORT = 4004;
const PACKAGE_NAME = 'api.admin.hs';


var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

var videoshow = require('videoshow');


var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token");
  next();
});
app.use(cors());

const managerFile = require('./hs_admin.manager.js');
var manager = new managerFile({});

app.get('/isAlive', function(req,res){
  res.json({message:`${PACKAGE_NAME} is Alive!`});
});

app.post('/device/add', function(req, res){
  let title = req.body.title;
  let type = req.body.type;

  manager.addDevice(title, type)
    .then(function(device){
      var data = { device: device };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/device/configList', function(req, res){
  manager.deviceConfigList()
    .then(function(foundDeviceList){
      var data = { deviceList: foundDeviceList };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
})

app.get('/device/getAll', function(req, res){
  manager.getAllDeviceList()
    .then(function(foundDeviceList){
      var data = { deviceList: foundDeviceList };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
})

app.get('/device/configList_download', function(req, res){
  manager.downloadDeviceConfigList()
    .then(function(foundDeviceListContent){
      res.attachment('config.txt');
      res.type('txt');
      res.send(foundDeviceListContent);
      res.end();
    })
    .catch(function(err){
      processError(res, err);
    });
})

app.get('/sensor/add', function(req, res){
  var manufactureId = '123a1df23fdsaewdsf12zxcv3h1re23';//req.body.manufactureId;
  var type = 'Detector';//req.body.type;

  manager.addSensor(manufactureId, type)
    .then(function(sensor){
      var data = { sensor: sensor };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

// LOG
app.post('/log/removeAllByDevice', function(req, res){
  let deviceId = req.body.deviceId;
  manager.removeAllLogByDevice(deviceId)
    .then(function(removedLogList){
      let data = {
        status: 'done'
      };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    })
})


// ARCHIVE
app.post('/archive/removeAllByDevice', function(req, res){
  let deviceId = req.body.deviceId;
  manager.removeAllArchiveByDevice(deviceId)
    .then(function(removedArchiveList){
      let data = {
        status: 'done'
      };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    })
})


app.get('/actuator/add', function(req, res){
  var manufactureId = '123a13fds7777dsf12zxcv3h1re23';//req.body.manufactureId;
  var type = 'Alarm';//req.body.type;

  manager.addActuator(manufactureId, type)
    .then(function(actuator){
      var data = { actuator: actuator };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/image/getAll', function(req, res){
  manager.getAllImageList()
    .then(function(foundImageList){
      let data = {
        imageList: foundImageList
      }
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    })
})

app.get('/image/getAll_device/:deviceId', function(req, res){
  let deviceId = req.params.deviceId;
  manager.getAllImageListByDevice(deviceId)
    .then(function(foundImageList){
      let data = {
        imageList: foundImageList
      }

      let htmlResponse = '<html>'
      for (var image of foundImageList) {
        htmlResponse+='<img src = "https://cdn.hushiar.com/' + image.fileName + '" style = "width:100px" /><br>';
      }
      htmlResponse += '</html>';
      res.send(htmlResponse);
      //processSuccess(res, imageUrlList);
      //processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    })
})

app.get('/image/stream/:deviceId', function(req, res){
  let deviceId = req.params.deviceId;
  manager.getAllImageListByDevice(deviceId)
    .then(function(foundImageList){

      var secondsToShowEachImage = 1;
      var finalVideoPath = '/projects/homeSecurity/server/storage/video/final.mp4';


      // setup videoshow options
      var videoOptions = {
        fps: 1,
        loop: 1,
        transition: false,
        videoBitrate: 512,
        videoCodec: 'libx264',
        size: '640x?',
        format: 'mp4',
        pixelFormat: 'yuv420p'
      }

      // array of images to make the 'videoshow' from
      var formatedImageList = foundImageList.map(function(image){
        return '/projects/homeSecurity/server/storage/images/' + image.fileName;
      })



        videoshow(formatedImageList,videoOptions)
          .save(finalVideoPath)
          .on('start', function (command) {
            console.log('ffmpeg process started:', command)
          })
          .on('error', function (err) {
            console.log(err);
          })
          .on('end', function () {
            console.log('done');
          })


        videoshow();


      let htmlResponse = '<html>done'
      htmlResponse += '</html>';
      res.send(htmlResponse);

    })
    .catch(function(err){
      processError(res, err);
    })
})

app.get('/user/getAll', function(req, res){
  manager.getUserList()
    .then(function(foundUserList){
      let data = {
        userList : foundUserList
      }
      processSuccess(res, data);

    })
    .catch(function(err){
      processError(res, err);
    })
})

app.post('/user/notifyTest', function(req, res){
  let userId = req.body.userId;
  let title = 'پیغام اومد؟'
  let message = 'سلام وقت بخیر!'
  manager.notifyUser(userId, title, message)
    .then(function(notifyResult){
      let data = {
        result : notifyResult
      }
      processSuccess(res, data);

    })
    .catch(function(err){
      processError(res, err);
    })
})

function processSuccess(res, data){
  res.json(data);
}

function processError(res, err){
  console.log(err);
  res.status(400).json({message: err.message });
}

app.listen(API_PORT,function(){
  console.log('Init ' + PACKAGE_NAME + ' on ' + API_PORT);
  console.log('Access URL : http://localhost:' + API_PORT);
});
