const API_PORT = 4002;
const PACKAGE_NAME = 'api.app.hs';
var ffmpeg = require('ffmpeg');
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


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token, locationId, deviceid, actuatorid,archiveid, sensorid, currentimageid ,imageid");
  next();
});

app.use(cors());


const managerFile = require('./hs_app.manager.js');
var manager = new managerFile({});

app.get('/isAlive', function(req,res){
  res.json({message:`${PACKAGE_NAME} is Alive!`});
});


app.get('/location/getAll', checkAuth, function(req, res){
  var user = req.user;
  manager.getAllLocation(user)
    .then(function(locationList){
      var data = { locationList: locationList };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/location/add', checkAuth, function(req, res){
  var user = req.user;
  var title = req.body.title;
  manager.addLocation(user, title)
    .then(function(location){
      var data = { location: location };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});


app.get('/device/getAll', function(req, res){
  manager.getAllDeviceByLocation(locationId)
    .then(function(deviceList){
      res.json({deviceList: deviceList});
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/device/getAll_user', checkAuth, function(req, res){
  console.log('we are here');
  var user = req.user;
  console.log(user);

  manager.getAllDeviceByUser(user)
    .then(function(deviceList){
      res.json({deviceList: deviceList});
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/device/get_user', checkAuth, function(req, res){
  var user = req.user;
  var deviceId = req.headers.deviceid;
  console.time();
  manager.getDeviceByUser(user, deviceId)
    .then(function(foundDevice){
      console.timeEnd();
      res.json({device: foundDevice});
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/device/assignLocation', checkAuth, function(req, res){
  var user = req.user;
  var manufactureId = req.body.manufactureId;
  var locationId = req.body.locationId;
  manager.assignLocation(locationId, manufactureId)
    .then(function(device){
      var data = { device: device };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/device/setAlarmStatus', checkAuth, function(req, res){
  var user = req.user;
  var deviceId = req.body.deviceId;
  var isOnAlarm = req.body.isOnAlarm;
  manager.setAlarmStatus(deviceId, isOnAlarm)
    .then(function(device){
      var data = { device: device };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/device/setIsMonitoring', checkAuth, function(req, res){
  var user = req.user;
  var deviceId = req.body.deviceId;
  var isMonitoring = req.body.isMonitoring;
  manager.setIsMonitoring(deviceId, isMonitoring)
    .then(function(device){
      var data = { device: device };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/device/setup', checkAuth, function(req, res){
  var user = req.user;
  var manufactureId = req.body.manufactureId;

  manager.setupDevice(user, manufactureId)
    .then(function(updatedDevice){
      res.json({
        device: updatedDevice
      });
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/device/setInfo', checkAuth, function(req, res){
  var user = req.user;
  var deviceId = req.body.deviceId;
  var title = req.body.title;
  var locationId = req.body.locationId;

  manager.setDeviceInfo(user, deviceId, title, locationId)
    .then(function(updatedDevice){
      res.json({
        device: updatedDevice
      });
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/deviceType/getAll', checkAuth, function(req, res){
  manager.getAllDeviceType()
    .then(function(foundDeviceTypeList){
      res.json({
        deviceTypeList: foundDeviceTypeList
      });
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/device/setStatus', checkAuth, function(req, res){
  let deviceId = req.body.deviceId;
  let status = req.body.status;

  manager.setDeviceSatus(deviceId, status)
    .then(function(updatedDevice){
      var data = {
        device: updatedDevice
      };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    })
})



app.post('/subscriber/add', checkAuth, function(req, res){
  var user = req.user;
  var deviceId = req.body.deviceId;
  var title = req.body.title;
  var mobileNumber = req.body.mobileNumber;

  manager.addSubscriber(user, deviceId, title, mobileNumber)
    .then(function(newSubscriber){
      res.json({
        subscriber: newSubscriber,
      });
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/subscriber/remove', checkAuth, function(req, res){
  var user = req.user;
  var deviceId = req.body.deviceId;
  var subscriberId = req.body.subscriberId;

  manager.removeSubscriber(user, deviceId, subscriberId)
    .then(function(newSubscriber){
      res.json({
        subscriber: newSubscriber,
      });
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/subscriber/getAll_device', checkAuth, function(req, res){
  var user = req.user;
  var deviceId = req.headers.deviceid;

  manager.getAllSubscriberByDevice(user, deviceId)
    .then(function(foundSubscriberList){
      res.json({
        subscriberList: foundSubscriberList
      });
    })
    .catch(function(err){
      processError(res, err);
    })
})





app.get('/actuator/getAll_device', checkAuth, function(req, res){
  var user = req.user;
  var deviceId = req.headers.deviceid;

  manager.getAllActuatorByDevice(user, deviceId)
    .then(function(foundActuatorList){
      res.json({
        actuatorList: foundActuatorList
      });
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/actuator/getImageListt', checkAuth, function(req, res){
  var user = req.user;
  var deviceId = req.headers.deviceid;
  var actuatorId = req.headers.actuatorId;

  manager.getAllImagesByActuator(actuatorId)
    .then(function(imageList){
      res.json({
        imageList: imageList
      });
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/actuator/getStream', function(req, res){
  var outputFilePath = '/projects/homeSecurity/server/storage/video/stream.mp4';
  res.download(outputFilePath, 'stream.mp4');
});

app.get('/actuator/getLastImage/:timeStamp',checkAuth, function(req, res){
  var deviceId = req.headers.deviceid;
  var actuatorId = req.headers.actuatorid;
  var currentImageId = req.headers.currentimageid;
  manager.getLastImageData(deviceId, actuatorId,currentImageId)
    .then(function(foundImage){
      res.json({
        image : foundImage,
      });
    })
    .catch(function(err){
      processError(res, err);
    });

});

app.post('/actuator/isActive',checkAuth, function(req, res){
  var deviceId = req.headers.deviceid;
  var actuatorId = req.headers.actuatorid;
  var isActive = req.body.isActive;


  manager.setActuatorIsAvtive(deviceId, actuatorId, isActive)
    .then(function(updatedActuator){
      res.json({
        actuator : updatedActuator,
      });
    })
    .catch(function(err){
      processError(res, err);
    });

});


app.get('/sensor/getAll_device', checkAuth, function(req, res){
  var user = req.user;
  var deviceId = req.headers.deviceid;

  manager.getAllSensorByDevice(user, deviceId)
    .then(function(foundSensorList){
      res.json({
        sensorList: foundSensorList
      });
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/sensor/isActive',checkAuth, function(req, res){
  var deviceId = req.headers.deviceid;
  var sensorId = req.headers.sensorid;
  var isActive = req.body.isActive;


  manager.setSensorIsAvtive(deviceId, sensorId, isActive)
    .then(function(updatedSensor){
      res.json({
        sensor : updatedSensor,
      });
    })
    .catch(function(err){
      processError(res, err);
    });

});

app.get('/log/getAll_device', checkAuth, function(req, res){
  var user = req.user;
  var deviceId = req.headers.deviceid;
  manager.getAllDeviceLog(user,deviceId)
    .then(function(foundLogList){
      res.json({
        logList : foundLogList,
      });
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/log/getAll_user', checkAuth, function(req, res){
  var user = req.user;
  manager.getAllUserLog(user)
    .then(function(foundLogList){
      res.json({
        logList : foundLogList,
      });
    })
    .catch(function(err){
      processError(res, err);
    });
});


// Archive
app.get('/archive/getAll_device', checkAuth, function(req, res){
  var user = req.user;
  var deviceId = req.headers.deviceid;
  manager.getAllDeviceArchive(user,deviceId)
    .then(function(foundArchiveList){
      res.json({
        archiveList : foundArchiveList,
      });
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/archive/getAll_user', checkAuth, function(req, res){
  var user = req.user;
  manager.getAllUserArchive(user)
    .then(function(foundArchiveList){
      res.json({
        archiveList : foundArchiveList,
      });
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.get('/archive/getOne', checkAuth, function(req, res){
  var user = req.user;
  var archiveId = req.headers.archiveid;

  manager.getArchive(user, archiveId)
    .then(function(foundArchive){
      res.json({
        archive : foundArchive,
      });
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/archive/delete', checkAuth, function(req , res){
  let archiveId = req.body.archiveId;
  var user = req.user;
  var deviceId = req.headers.deviceid;

  manager.deleteArchiveByDeviceImage(user, deviceId, archiveId)
    .then(function(deletedArchive){
      let data = {
        archive: deletedArchive
      };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    })
})


app.get('/user/get', checkAuth, function(req, res){
  var user = req.user;
  let data = {
    user: user
  };

  processSuccess(res, data);
});

app.post('/user/signup', function(req, res){
  var mobileNumber = req.body.mobileNumber;
  var title = req.body.title;

  manager.singup(title, mobileNumber)
    .then(function(newUser){
      var data = {user: newUser };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    });
});

app.post('/user/updateInfo', checkAuth, function(req, res){
  let user = req.user;
  let title = req.body.title;
  let email = req.body.email;

  manager.updateUserInfo(user, title, email)
    .then(function(updatedUser){
      let data = {
        user: updatedUser
      };
      processSuccess(res, data);
    })
    .catch(function(err){
        processError(res, err);
    })
})

app.post('/user/signinWithMobileNumber', function(req, res){
  var mobileNumber = req.body.mobileNumber;
  manager.sendTokenToMobileNumber(mobileNumber)
    .then(function(){
        res.send({
          type: true,
        });
    })
    .catch(function(err){
      processError(res,err);
    });
});

app.post('/user/checkCodeWithMobileNumber', function(req, res){
  var mobileNumber = req.body.mobileNumber;
  var code = req.body.code;
  manager.checkCodeWithMobileNumber(mobileNumber, code)
    .then(function(foundAuth){
        res.send({
          auth: foundAuth._id,
        });
    })
    .catch(function(err){
      processError(res,err);
    });
});

app.post('/user/subscribeWebPush', checkAuth , function(req, res){
  var user = req.user;
  var sub = req.body.sub;

  manager.subscribeWebPush(user, sub)
    .then(function(updatedUser){
      res.json({
        user : updatedUser,
      });
    })
    .catch(function(err){
      processError(res, err);
    });
})

app.post('/user/increaseCredit', checkAuth, function(req, res){
  let user = req.user;
  let price = req.body.price;

  manager.increaseCredit(user, price)
    .then(function(paymentUrl){
      let data = {
        paymentUrl: paymentUrl
      };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    })
})


//Notify User on Socket

app.post('/internal/notifyUser', function(req, res){
  var userId = req.body.userId;
  var deviceId = req.body.deviceId;
  var isOnAlarm = req.body.isOnAlarm;
  manager.notifyUserOnSocket(userId, deviceId, isOnAlarm);
  res.json({type:true});
});

app.post('/internal/newImage', function(req, res){
  var userId = req.body.userId;
  var deviceId = req.body.deviceId;
  var actuatorId = req.body.actuatorId;

  manager.notifyNewImageUserOnSocket(userId, deviceId, actuatorId);
  res.json({type:true});
});

app.post('/internal/newLog', function(req, res){
  var userId = req.body.userId;
  var deviceId = req.body.deviceId;
  var log = req.body.log;

  manager.notifyNewLogOnSocket(userId, deviceId, log);
  res.json({type:true});
});

// Video
app.get('/video/:token/:archiveId',checkAuth, function(req, res){
    let archiveId = req.params.archiveId;
    let user = req.user;
    manager.getArchiveVideoFile(user, archiveId)
      .then(function(archiveVideoPath){
        console.log('archiveVideoPath');
        console.log(archiveVideoPath);
        res.sendFile(archiveVideoPath);
      })
      .catch(function(err){
        processError(res, err);
      })
})

app.get('/video/getAll_device', checkAuth, function(req, res){
  let user = req.user;
  let deviceId = req.headers.deviceid;

  manager.getVideoListByDevice(user,deviceId)
    .then(function(foundVideoList){
      let data = {
        videoList : foundVideoList
      };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    })

})

// Image
app.post('/image/getAll_device', checkAuth, function(req , res){
  let date = req.params.date;
  var user = req.user;
  var deviceId = req.headers.deviceid;

  manager.getImageListByDeviceByDate(user, deviceId, date)
    .then(function(imageList){
      let data = {
        imageList: imageList
      };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    })
})

app.post('/image/delete', checkAuth, function(req , res){
  let imageId = req.body.imageId;
  var user = req.user;
  var deviceId = req.headers.deviceid;

  manager.deleteImageByDeviceImage(user, deviceId, imageId)
    .then(function(deletedImage){
      let data = {
        imageList: deletedImage
      };
      processSuccess(res, data);
    })
    .catch(function(err){
      processError(res, err);
    })
})

app.get('/image/get', checkAuth, function(req, res){
  var user = req.user;
  var deviceId = req.headers.deviceid;
  var imageId = req.headers.imageid;

  manager.getImageContent(user, deviceId, imageId)
    .then(function(imageInfo){
      let data = {
        imageInfo: imageInfo
      };
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


io.on('connection', function(socket){
  console.log(`Socket Connected :: ${socket.user.title}`);
  manager.addNewSocketConnection(socket);
});

io.use(checkSocketAuth);

function checkSocketAuth(socket, callBack){
  var query = socket.handshake.query;
  var token = query.token;
  if(token){
    var authId = token;
    if(authId){
      manager.getAuthByAuthId(authId)
        .then(function(foundAuth){
          socket.user = foundAuth.user;
          callBack();
        })
        .catch(function(err){
          console.log(err);
          socket.close();
        });
    }else{
      let errorMessage = 'Access Denied on socket connection';
      console.log(errorMessage);
      socket.conn.close(403,errorMessage);
    }
  }else{
    let errorMessage = 'Access Denied on socket connection';
    console.log(errorMessage);
    socket.conn.close(403,errorMessage);
  }
}

app.get('/socket/getAll', function(req, res){
  var socketList  = manager.getSocketList();
  var reuslt = socketList.map(function(socket){
    return socket.user;
  });
  res.json({ socketList: reuslt});
});

http.listen(API_PORT,function(){
  console.log('Init ' + PACKAGE_NAME + ' on ' + API_PORT);
  console.log('Access URL : http://localhost:' + API_PORT);
});
