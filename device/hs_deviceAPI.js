const API_PORT = 4003;
const PACKAGE_NAME = 'api.device.hs';

var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var multer  = require('multer');
var uuid = require('uuid');
var path = require('path');
var cors = require('cors');


var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));







app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, devicemanufactureid, device-id");
  next();
});
app.use(cors());

const managerFile = require('./hs_device.manager.js');
var manager = new managerFile({});

const CAMERA_IMAGE_STORAGE_PATH = '/projects/homeSecurity/server/storage/images';
var cameraImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('destination');
    cb(null, CAMERA_IMAGE_STORAGE_PATH);
  },

  onError: function (error, next) {
    console.log('onError');
    console.log(error);
    next(error);
  },

  filename: function (req, file, cb) {
    console.log('filename');
    cb(null, uuid.v4() + path.extname(file.originalname));
  },
});

var cameraImageUploader = multer({
  storage : cameraImageStorage,
});

function storeFile(imageBuffer){
  let file = {
    filename : uuid.v4()+'.jpg',
  };

  let fileName = uuid.v4()+'.jpg';

  fs.writeFile(CAMERA_IMAGE_STORAGE_PATH+'/'+file.filename, imageBuffer,  "binary",function(err) {
    if(err){
      console.log(err);
    }else{
      var deviceManufactureId = '123a1df23fdsa12zxcv3h1re23';
      var actuatorManufactureId= '123a13fds7777dsf1dede2zxcv3dsde23';

      var captureLogData = {
        type: 'Capture',
        manufactureId: '123a13fds7777dsf1dede2zxcv3dsde23',
        value: file.filename,
      };

      manager.captureImage(file,deviceManufactureId, actuatorManufactureId)
        .then(function(savedImage){
          //res.send('1');
          console.log(savedImage);
        })
        .catch(function(err){
          console.log(err);
        });
    }

   });
}

app.get('/isAlive', function(req,res){
  res.json({message:`${PACKAGE_NAME} is Alive!`});
});

app.get('/register/:deviceManufactureId',function(req, res){
  let deviceManufactureId = req.params.deviceManufactureId;
  console.log(deviceManufactureId);
  manager.registerDeviceToken(deviceManufactureId)
    .then(function(registerResultData){
      processSuccess(res, registerResultData);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/verbose', function(req, res){
  var data = req.body.data;
  var deviceManufactureId = '123a1df23fdsa12zxcv3h1re23';
  manager.ingestVerbose(deviceManufactureId, data)
    .then(function(createdVerbose){
      res.json({done: true});
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/mvp/update_status', function(req, res){
  // console.log(req.body);
  console.log(req.headers);
  console.log('--------- query ---------------');
  console.log(req.query);
  console.log('------------------------');
  manager.mvpIngest(req.query)
    .then(function(result){
      console.log('--------- result ---------------');
      console.log(result);
      console.log('------------------------');
      res.json(result);
    })
    .catch(function(err){
      processError(res, err);
    });

});

app.post('/mvp/update_status', function(req, res){
  // console.log(req.body);
  // console.log(req.headers);
  console.log('--------- body  ---------------');
  console.log(req.body);
  console.log('------------------------');
  manager.mvpIngest(req.body)
    .then(function(result){
      console.log('--------- result ---------------');
      console.log(result);
      console.log('------------------------');
      res.json(result);
    })
    .catch(function(err){
      processError(res, err);
    });

});

app.post('/mvp/upload_image1', cameraImageUploader.single('imageFile'),function(req, res){
  console.log(req.file);
  res.json({type:true});
});

app.post('/mvp/upload_image', cameraImageUploader.single('imageFile') ,function(req, res){
  console.log(req.file);

  var deviceManufactureId = '123a1df23fdsa12zxcv3h1re23';
  var actuatorManufactureId= '123a13fds7777dsf1dede2zxcv3dsde23';

  var captureLogData = {
    type: 'Capture',
    manufactureId: '123a13fds7777dsf1dede2zxcv3dsde23',
    value: req.file,
  };

  manager.captureImage(req.file,deviceManufactureId, actuatorManufactureId)
    .then(function(savedImage){
      res.send('1');
    })
    .catch(function(err){
      processError(res, err);
    });


  // manager.ingestLog(deviceManufactureId,captureLogData)
  //   .then(function(insertedLog){
  //     var data = {
  //       log: insertedLog
  //     };
  //     console.log("Image Saved To DataLog");
  //     console.log(data);
  //     //processSuccess(res, data);
  //     res.send('1');
  //   })
  //   .catch(function(err){
  //     processError(res, err);
  //   });



});

app.get('/sensor/attached', function(req,res){
  var deviceManufactureId = '123a1df23fdsa12zxcv3h1re23';//req.body.deviceManufactureId;
  var sensorManufactureId = '123aqa1df23fdsaewdsf12zxcv3h1re23';//req.body.sensorManufactureId;
  manager.attachSensor(deviceManufactureId, sensorManufactureId)
    .then(function(updatedSensor){
      var data = { sensor: updatedSensor };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/sensor/detach', function(req,res){
  var deviceManufactureId = req.body.deviceManufactureId;
  var sensorManufactureId = req.body.sensorManufactureId;
  manager.detachSensor(deviceManufactureId, sensorManufactureId)
    .then(function(updatedSensor){
      var data = { sensor: updatedSensor };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/actuator/attached', function(req,res){
  var deviceManufactureId = req.body.deviceManufactureId;
  var actuatorManufactureId = req.body.actuatorManufactureId;
  manager.attachActuator(deviceManufactureId, actuatorManufactureId)
    .then(function(updatedActuator){
      var data = { actuator: updatedActuator };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/actuator/detach', function(req,res){
  var deviceManufactureId = req.body.deviceManufactureId;
  var actuatorManufactureId = req.body.actuatorManufactureId;
  manager.detachActuator(deviceManufactureId, actuatorManufactureId)
    .then(function(updatedActuator){
      var data = { actuator: updatedActuator };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/device/heartBeat', function(req,res){
  console.log(req.body);
  res.json({ type: true });
});

app.post('/device/ingetLog', function(req,res){
  console.log('--------------- date ---------------');
  console.log(new Date());
  console.log('--------------req.headers-----------');
  console.log(req.headers);

  console.log('--------------req.body-----------');
  console.log(req.body);

  // console.log('--------------req-----------');
  // console.log(req);

  var deviceManufactureId = req.headers.devicemanufactureid;
  var logData = req.body.data;
  manager.ingestLog(deviceManufactureId,logData)
    .then(function(insertedLog){
      var data = {
        log: insertedLog
      };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/device/getAllCommand',function(req, res){
  var deviceManufactureId = req.headers.devicemanufactureid;
  manager.getAllNewCommands(deviceManufactureId)
    .then(function(foundCommandList){
      var data = {
        commandList: foundCommandList
      };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/device/onAlarm', function(req,res){
  var deviceManufactureId = req.headers.devicemanufactureid;
  var isOnAlarm = req.body.isOnAlarm;
  manager.setDeviceOnAlarmState(deviceManufactureId,isOnAlarm)
    .then(function(updatedDevice){
      var data = {
        device: updatedDevice
      };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});


app.post('/device/commandExecuteResult', function(req,res){
  var deviceManufactureId = req.headers.devicemanufactureid;
  var commandId = req.body.commandId;
  var isDone = req.body.isDone;
  manager.setCommandExecuteResult(deviceManufactureId, commandId, isDone)
    .then(function(updatedCommand){
      var data = {
        command: updatedCommand
      };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

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
