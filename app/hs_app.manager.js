
var iocFile = require('../manager/ioc.manager.js');
var ioc = new iocFile();
const fs = require("fs");
const { exec } = require("child_process");


//ioc.manager.mqtt.setSubscribtionCallBackFunction(newMessageOnMqtt);

var socketList = [];

function newMessageOnMqtt(deviceManufactureId, actuatorManufactureId, message){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.get_manufactureId(deviceManufactureId)
      .then(function(foundDevice){
          if(foundDevice){
            ioc.manager.actuator.get_manufactureId_device(foundDevice, actuatorManufactureId)
              .then(function(foundActuator){
                if(foundActuator){
                  console.log(foundActuator.type);
                  if(foundActuator.type == 'Capture'){
                    //console.log('this a camera topic');
                  }else{
                    //console.log('this a not camera topic');
                  }
                }else{
                  reject(new Error('No Acutuator ser For Device with actuatorManufactureId : '+ actuatorManufactureId));
                }
              })
              .catch(function(err){
                reject(err);
              });
          }else{
            reject(new Error('No Device Found By deviceManufactureId : ' + deviceManufactureId));
          }
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function addNewSocketConnection(socket){
  socketList = ioc.manager.socket.newConnection(socketList, socket);
  socket.on('disconnect', function(){
    console.log('disocnnected');
    var newSocketList = ioc.manager.socket.removeConnection(getSocketList(), socket);
    setSocketList(newSocketList);
  });
}

function getSocketList(){
  return socketList;
}

function setSocketList(newSocketList){
  socketList = newSocketList;
}

function subscribeWebPush(user, sub){
  return new Promise(function(resolve, reject) {
    ioc.manager.user.get(user._id)
      .then(function(foundUser){
        if(foundUser){
          let foundWsSub = foundUser.wpSubList.find(function(wsSub){
            if(
              wsSub.keys.p256dh == sub.keys.p256dh &&
              wsSub.keys.auth == sub.keys.auth
            ){
              return wsSub;
            }
          });

          if(!foundWsSub){
            ioc.manager.user.addWebPushSub(user, sub)
              .then(function(updatedUser){
                resolve(updatedUser);
              })
              .catch(function(err){
                reject(err);
              })
          }else{
            console.log('Webpush key exist');
            resolve(foundUser);
          }
        }else{
          let errorMessage = `No User found With ID ${user._id}`;
          reject(new Error(errorMesaage));
        }
      })
      .catch(function(err){
        reject(err)
      })
  });
}


function notifyUserOnSocket(userId, deviceId, isOnAlarm){
  console.log('we we we are here');
    var foundSocket = ioc.manager.socket.getByUser(socketList, userId);
    if(foundSocket){
      foundSocket.emit('deviceOnAlert',{deviceId: deviceId, isOnAlarm: isOnAlarm});
    }

}

function notifyNewImageUserOnSocket(userId, deviceId, actuatorId){
    var foundSocket = ioc.manager.socket.getByUser(socketList, userId);
    if(foundSocket){
      getLastImage(userId, deviceId, actuatorId)
        .then(function(foundImage){
          console.log('New Image Notification on Seokcet');

          fs.readFile(imageFilePath,{ encoding: 'base64' }, (err, imageContent) => {
            if (err) {
              console.log(err);
            }
            let imageData = {
              _id: foundImage._id,
              contentBase46: imageContent,
              registerDate: foundImage.registerDate,
              deviceId: deviceId,
              actuatorId: actuatorId,
            }
            foundSocket.emit('newImage',imageData, function(data){
              console.log(data);
            });
          })

        })
        .catch(function(err){
          console.log(err);
        });
    }
}

function notifyNewLogOnSocket(userId,deviceId,log){
  var foundSocket = ioc.manager.socket.getByUser(socketList, userId);
  if(foundSocket){
    foundSocket.emit('newLog',{deviceId: deviceId, log: log});
  }
}


function getAllLocation(user){
  return ioc.manager.location.getAll_user(user);
}

function getAllDeviceByUser(user){
  return new Promise(function(resolve, reject) {
      ioc.manager.device.getAll_user(user)
        .then(function(deviceList){
          let result = deviceList.map(function(device){
            let transformedDevice = device;
            transformedDevice.user = undefined;
            transformedDevice.registerDate = undefined;
            return transformedDevice;
          })
          resolve(result);
        })
        .catch(function(err){
          reject(err);
        });
  });
}

function getDeviceByUser(user, deviceId){
  return new Promise(function(resolve, reject) {
      ioc.manager.device.get_user(user, deviceId)
        .then(function(foundDevice){
          let transformedDevice = foundDevice;
          transformedDevice.user = undefined;
          transformedDevice.registerDate = undefined;
          resolve(transformedDevice);
        })
        .catch(function(err){
          reject(err);
        });
  });
}

function addLocation(user, title) {
    return ioc.manager.location.add(user, title);
}

//User
function singup(title, mobileNumber){
  return ioc.manager.user.create(title, mobileNumber);
}

function updateUserInfo(user, title, email){
  return ioc.manager.user.updateInfo(user._id, title, email);
}

function increaseCredit(user, price){
  return new Promise(function(resolve, reject) {
    resolve('https://vandar.io/request/AD8TA29FFV')
  });
}


function assignLocation(location, manufactureId){
  return ioc.manager.device.assignLocation(location, manufactureId);
}

function setAlarmStatus(deviceId, alarmStatus){
  return new Promise(function(resolve, reject) {
      ioc.manager.device.setIsOnAlarmById(deviceId, alarmStatus)
        .then(function(updatedDevice){
          var commandText = 'ALARM_OFF';
          if(alarmStatus == true){
            commandText = 'ALARM_ON';
          }
          ioc.manager.command.create_device(updatedDevice,commandText)
            .then(function(createdCommand){
              resolve(updatedDevice);
            })
            .catch(function(err){
              reject(err);
            });
        })
        .catch(function(err){
          reject(err);
        });
  });
}

function setIsMonitoring(deviceId, isMonitoring){
  return new Promise(function(resolve, reject) {
      ioc.manager.device.setIsMonitoring(deviceId, isMonitoring)
        .then(function(updatedDevice){
          resolve(updatedDevice);
        })
        .catch(function(err){
          reject(err);
        });
  });
}

//Sucbscriber
function addSubscriber(user, deviceId, title, mobileNumber){
  return new Promise(function(resolve, reject) {
      ioc.manager.device.get_user(user, deviceId)
        .then(function(foundDevice){
          if(foundDevice){
              ioc.manager.subscriber.add(foundDevice, title, mobileNumber)
                .then(function(newSubscriber){
                  ioc.manager
                    .log
                    .addSubscriber(foundDevice,title)
                    .then(function(insertedLog){
                      console.log(insertedLog);
                    })
                    .catch(function(err){
                      console.log(err);
                    });
                  resolve(newSubscriber)
                })
                .catch(function(err){
                  reject(err);
                })
          }
          else{
            var noDeviceFoundError = new Error('No Device Found With Id '+ deviceId);
          }
        })
        .catch(function(err){
          reject(err);
        });
  });

}

function getAllSubscriberByDevice(user, deviceId){
  return ioc.manager.subscriber.getAll_device(deviceId);
}

function removeSubscriber(user, deviceId, subscriberId){
  return ioc.manager.subscriber.remove(deviceId, subscriberId);
}

function getAllDeviceLog(user, deviceId){
  return ioc.manager.log.getAll_device(deviceId);
}


// Archive
function getAllDeviceArchive(user, deviceId){
  return ioc.manager.archive.getAll_device(deviceId);
}

function deleteArchiveByDeviceImage(user, deviceId, archiveId){
    return ioc.manager.archive.delete_device_archiveId(user._id, deviceId, archiveId);
}

function getAllUserLog(user){
  return new Promise(function(resolve, reject) {
      ioc.manager.device.getAll_user(user)
        .then(function(foundUserDeviceList){
          ioc.manager.log.getAll_deviceList(foundUserDeviceList)
            .then(function(foundLogList){
              resolve(foundLogList);
            })
            .catch(function(err){
              reject(err);
            });
        })
        .catch(function(err){
          reject(err);
        });
  });
}

function getAllUserArchive(user){
  return new Promise(function(resolve, reject) {
      ioc.manager.device.getAll_user(user)
        .then(function(foundUserDeviceList){
          ioc.manager.archive.getAll_deviceList(foundUserDeviceList)
            .then(function(foundArchiveList){
              resolve(foundArchiveList);
            })
            .catch(function(err){
              reject(err);
            });
        })
        .catch(function(err){
          reject(err);
        });
  });
}

function getArchive(user, archiveId){
  return ioc.manager.archive.get(archiveId);
}

function getAllActuatorByDevice(user, deviceId){
  return ioc.manager.actuator.getAll_device(deviceId);
}

function getAllSensorByDevice(user, deviceId){
  return ioc.manager.sensor.getAll_device(deviceId);
}

function setupDevice(user, manufactureId){
  return ioc.manager.device.setup(user, manufactureId);
}

function setDeviceInfo(user, deviceId, title, locationId){
  return ioc.manager.device.setInfo(deviceId, title, locationId);
}

function setDeviceSatus(deviceId, status){
  return new Promise(function(resolve, reject) {




    ioc.manager.device.setStatus(deviceId, status)
      .then(function(updatedDevice){
        if(status == 'home'){
          console.log('home flow');
          ioc.manager.actuator.setIsActive_device_type(updatedDevice,'Buzzer',false)
            .then(function(updatedBuzer){
              console.log(updatedBuzer);
              ioc.manager.mqtt.setStatus(updatedDevice.token, updatedBuzer.type ,false)
              ioc.manager.actuator.setIsActive_device_type(updatedDevice,'Beacon',false)
              .then(function(updatedBeacon){
                console.log(updatedBeacon);
                ioc.manager.mqtt.setStatus(updatedDevice.token, updatedBeacon.type ,false)
                ioc.manager.sensor.setIsActive_device_type(updatedDevice,'Detector',false)
                .then(function(updatedDetector){
                  ioc.manager.mqtt.setStatus(updatedDevice.token, updatedDetector.type ,false);
                  ioc.manager.log.deviceStatusChanged(updatedDevice);
                  console.log(updatedDetector);
                })
                .catch(function(err){
                  console.log(err);
                  reject(err);
                })
              })
              .catch(function(err){
                console.log(err);
                reject(err);
              })
            })
            .catch(function(err){
              console.log(err);
              reject(err);
            })


        }else if (status == 'silentMonitoring'){
          console.log('silentMonitoring flow');
          ioc.manager.actuator.setIsActive_device_type(updatedDevice,'Buzzer',false)
            .then(function(updatedBuzer){
              console.log(updatedBuzer);
              ioc.manager.mqtt.setStatus(updatedDevice.token, updatedBuzer.type ,false)
              ioc.manager.actuator.setIsActive_device_type(updatedDevice,'Beacon',false)
              .then(function(updatedBeacon){
                console.log(updatedBeacon);
                ioc.manager.mqtt.setStatus(updatedDevice.token, updatedBeacon.type ,false)
                ioc.manager.sensor.setIsActive_device_type(updatedDevice,'Detector',true)
                .then(function(updatedDetector){
                  ioc.manager.mqtt.setStatus(updatedDevice.token, updatedDetector.type ,true);
                  ioc.manager.log.deviceStatusChanged(updatedDevice);
                  console.log(updatedDetector);
                })
                .catch(function(err){
                  console.log(err);
                  reject(err);
                })
              })
              .catch(function(err){
                console.log(err);
                reject(err);
              })
            })
            .catch(function(err){
              console.log(err);
              reject(err);
            })
        }else if (status == 'secureMonitoring'){
          console.log('secureMonitoring flow');
          ioc.manager.actuator.setIsActive_device_type(updatedDevice,'Buzzer',true)
            .then(function(updatedBuzer){
              console.log(updatedBuzer);
              ioc.manager.mqtt.setStatus(updatedDevice.token, updatedBuzer.type ,true)
              ioc.manager.actuator.setIsActive_device_type(updatedDevice,'Beacon',true)
              .then(function(updatedBeacon){
                console.log(updatedBeacon);
                ioc.manager.mqtt.setStatus(updatedDevice.token, updatedBeacon.type ,true)
                ioc.manager.sensor.setIsActive_device_type(updatedDevice,'Detector',true)
                .then(function(updatedDetector){
                  ioc.manager.mqtt.setStatus(updatedDevice.token, updatedDetector.type ,true);
                  ioc.manager.log.deviceStatusChanged(updatedDevice);
                  console.log(updatedDetector);
                })
                .catch(function(err){
                  console.log(err);
                  reject(err);
                })
              })
              .catch(function(err){
                console.log(err);
                reject(err);
              })
            })
            .catch(function(err){
              console.log(err);
              reject(err);
            })
        }
        resolve(updatedDevice);
      })
      .catch(function(err){
        reject(err);
      })
  });
}

function prcosseHomeStatus(device){

}

function getAllDeviceType(){
  return ioc.manager.deviceType.getAll();
}

function sendTokenToMobileNumber(mobileNumber){
  return new Promise(function(resolve, reject) {
    ioc.manager.user.get_mobileNumber(mobileNumber)
      .then(function(foundUser){
        if(foundUser){
          resolve(getAuthValidationToken(foundUser));
        }else{
          ioc.manager.user.create_mobileNumber(mobileNumber)
            .then(function(createdUser){
              resolve(getAuthValidationToken(createdUser));
            })
            .catch(function(err){
              reject(err);
            });
        }
      })
      .catch(function(err){
        reject(err);
      });
  });
}


function getAuthValidationToken(user){
  return new Promise(function(resolve, reject) {
    ioc.manager.auth.get_user(user)
      .then(function(foundAuth){
        if(foundAuth){
          ioc.manager.auth.revokeToken(foundAuth)
            .then(function(revokedAuth){
              ioc.manager.notify.sendVerificationCode(user.mobileNumber,foundAuth.authToken)
                .then(function(result){
                    resolve(revokedAuth);
                })
                .catch(function(err){
                  reject(err);
                });
            })
            .catch(function(err){
              reject(err);
            });
        }else{
          ioc.manager.auth.create_user(user)
            .then(function(createdAuth){
              ioc.manager.notify.sendVerificationCode(user.mobileNumber,createdAuth.authToken)
                .then(function(result){
                    resolve(createdAuth);
                })
                .catch(function(err){
                  reject(err);
                });
            })
            .catch(function(err){
              reject(err);
            });
        }
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function checkCodeWithMobileNumber(mobileNumber, authToken){
  return new Promise(function(resolve, reject) {
    ioc.manager.user.get_mobileNumber(mobileNumber)
      .then(function(foundUser){
        if(foundUser){
          ioc.manager.auth.get_user_authToken(foundUser, authToken)
            .then(function(foundAuth) {
              if (foundAuth) {
                ioc.manager.user.validateMobileNumber(foundUser._id)
                  .then(function(validatedMobileNumberUser) {
                    resolve(foundAuth);
                  })
                  .catch(function(err){
                    rejecet(err);
                  });
              }else {
                reject(new Error('کد تایید صحیح نمیباشد.'));
              }
            })
            .catch( function(err) {
              reject(err);
            });
        }else{
          reject(new Error('کاربر پیدا نشد'));
        }
      })
      .catch(function(err){
        reject(err);
      });

  });
}

// image
function getAllImagesByActuator(actuatorId){

}

function getImageListByDeviceByDate(user, deviceId, date){
  return ioc.manager.image.getAll_device_date(deviceId, date);
}

function deleteImageByDeviceImage(user, deviceId, imageId){
  return ioc.manager.image.delete_device_imageId(user._id, deviceId, imageId);
}

function createVideo(){
  var imageFilePathList = [
    "/projects/homeSecurity/server/storage/imagesList/3a6adf9e-7c3b-4778-bd3a-792863f26f6d.jpg",
    "/projects/homeSecurity/server/storage/imagesList/750f6f3a-b93d-4281-88d9-321aa3bdfe55.jpg",
    "/projects/homeSecurity/server/storage/imagesList/90ab8c3a-24b9-4720-9175-940e58582fa8.jpg",
    "/projects/homeSecurity/server/storage/imagesList/a3a135ec-d48f-425e-9149-995b3a84b6e4.jpg",
    "/projects/homeSecurity/server/storage/imagesList/c286d3ff-0c1c-4372-80cb-acf897d07606.jpg",
    "/projects/homeSecurity/server/storage/imagesList/c49907cb-a8cc-4e5a-821c-f614450af4ad.jpg",
    "/projects/homeSecurity/server/storage/imagesList/ca30db4c-dda1-4c96-87ee-6e11dcbba28c.jpg",
    "/projects/homeSecurity/server/storage/imagesList/f99152ad-4e62-4045-b443-ec006fb71c2d.jpg"
  ];
  var list= [];
  var imageFilePathList = imageFilePathList.forEach((file)=>{
      list += `file ${file}`;
      list += "\n";
  })

  var outputFilePath = '/projects/homeSecurity/server/storage/video/stream.mp4';

  // var writeStream = fs.createWriteStream(imageFilePathList);
  // writeStream.write(list);
  // writeStream.end();


  exec(
      `ffmpeg -safe 0 -f concat -i /projects/homeSecurity/server/storage/imagesList/list.txt -c copy ${outputFilePath}`,
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        } else {
          console.log("videos are successfully merged");

        }
      }
    );
}

function getLastImage(userId, deviceId, actuatorId){
  return new Promise(function(resolve, reject) {
    ioc.manager.image.get_device_actuator(deviceId, actuatorId)
      .then(function(foundImage){
        let imageFilePath = ioc.manager.image.getImagePathWithFileName(userId, deviceId, foundImage.fileName);
        resolve(foundImage);
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function getLastImageData(deviceId, actuatorId, currentImageId){
  return new Promise(function(resolve, reject) {
    ioc.manager.memStorage.getDiveceLastImage(deviceId, actuatorId)
      .then(function(foundImageData){
        if(foundImageData){
          let jsonFoundImageData = JSON.parse(foundImageData);
          if(currentImageId != 'NaN'){
            if(jsonFoundImageData._id == currentImageId){
              let imageData = {
                _id: undefined,
                contentBase46: undefined,
                registerDate: undefined,
                deviceId: deviceId,
                actuatorId: actuatorId,
              }
              resolve(imageData);
            }else{
              resolve(jsonFoundImageData);
            }
          }else{
            resolve(jsonFoundImageData);
          }
        }else{
          let imageData = {
            _id: undefined,
            contentBase46: undefined,
            registerDate: undefined,
            deviceId: deviceId,
            actuatorId: actuatorId,
          }
          resolve(imageData);
        }

      })
      .catch(function(err){
        reject(err);
      })
  });
}

function getImageContent(user, deviceId, imageId){
  return new Promise(function(resolve, reject) {
    ioc.manager.image.get_device_imageId(deviceId, imageId)
      .then(function(foundImage){
        if(foundImage){
          let imageFilePath = ioc.manager.image.getImagePathWithFileName(user._id, deviceId, foundImage.fileName);
          ioc.manager.image.getBase64FromPath(imageFilePath)
            .then(function(contentBase46){
              let imageData = {
                _id: foundImage._id,
                contentBase46: contentBase46,
                registerDate: foundImage.registerDate,
                deviceId: foundImage.device._id,
              }
              resolve(imageData);
            })
            .catch(function(err){
              reject(err);
            })
        }else{
          let errorMessage = `No Image Found with Id ${imageId} for device ${deviceId}`;
          reject(new Error(errorMessage));
        }
      })
      .catch(function(err){
        reject(err);
      })
  });
}


function getAuthByAuthId(authId){
  return ioc.manager.auth.get(authId);
}

function setActuatorIsAvtive(deviceId, actuatorId, isActive){
  return new Promise(function(resolve, reject) {
    ioc.manager.actuator.get_actuatorId_device(deviceId, actuatorId)
      .then(function(foundActuator){
        if(foundActuator){
          ioc.manager.mqtt.setStatus(foundActuator.device.token, foundActuator.type , isActive);

          if(foundActuator.isActive != isActive){
            ioc.manager.actuator.setIsActive(deviceId, actuatorId, isActive)
              .then(function(updatedActuator){
                resolve(updatedActuator);
              })
              .catch(function(err){
                reject(err);
              });
          }else{
            resolve(foundActuator);
          }
        }else{
          let errorMessage = `No Device Found With ${deviceId} ${actuatorId}`;
          console.log(errorMesaage);
          reject(new Error(errorMesaage));
        }
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function setSensorIsAvtive(deviceId, sensorId, isActive){
  console.log('we are here');
  return new Promise(function(resolve, reject) {
    ioc.manager.sensor.get_sensorId_device(deviceId, sensorId)
      .then(function(foundSensor){
        if(foundSensor){
          ioc.manager.mqtt.setStatus(foundSensor.device.token, foundSensor.type , isActive);
          ioc.manager.sensor.setIsActive(foundSensor.device, foundSensor._id, isActive)
            .then(function(updatedSensor){
              resolve(updatedSensor);
            })
            .catch(function(err){
              reject(err);
            });
        }else{
          reject(new Error(`No Sensor Found With deviceId ${deviceId} and sensorId ${sensorId}`));
        }
      })
      .catch(function(err){
        reject(err);
      });
  });

}

// ============= Archive ===================

function getArchiveVideoFile(user, archiveId){
  return new Promise(function(resolve, reject) {
      ioc.manager.archive.get(archiveId)
        .then(function(foundArchive){
          if(foundArchive){
            if(foundArchive.videoFileName){
                let archiveVideoPath = ioc.manager.video.getVideoPathWithFileName(user._id.toString(),foundArchive.device._id.toString(),foundArchive.videoFileName)
                resolve(archiveVideoPath);
            }else{
              let errorMessage = `No video for Archive Found ${foundArchive._id}`;
              reject(new Error(errorMessage));
            }

          }else{
            let errorMessage = `No Archive Found With id ${archiveId}`
            reject(new Error(errorMessage));
          }
        })
        .catch(function(err){
          reject(err);
        })
  });

}

function translateVideoArchiveListToApiResponse(userId, deviceId, videoArchiveList){
  return new Promise(function(resolve, reject) {
    let promiseList = videoArchiveList.map(function(videoArchive){
      if(
        videoArchive.imageList &&
        videoArchive.imageList.length > 0
      ){
        let image = videoArchive.imageList[0];
        let imageFilePath = ioc.manager.image.getImagePathWithFileName(userId, deviceId, image.fileName);
        return new Promise(function(resolve, reject) {
          ioc.manager.image.getBase64FromPath(imageFilePath)
            .then(function(contentBase46){
              let result = {
                _id: videoArchive._id,
                thumbnailBase64: contentBase46,
                startDate: videoArchive.startDate
              };
              resolve(result);
            })
            .catch(function(err){
              reject(err);
            })
        });
      }else{
        return new Promise(function(resolve, reject) {
          let result = {
            _id: videoArchive._id,
            startDate: videoArchive.startDate
          };
          resolve(result);
        });
      }
    });

    Promise.all(promiseList)
      .then(function(resultSet){
        resolve(resultSet)
      })
      .catch(function(err){
        console.log(err);
        reject(err);
      });


  });

}

function getVideoListByDevice(user,deviceId){
  return new Promise(function(resolve, reject) {
    ioc.manager.archive.getAllVideo_device(deviceId)
      .then(function(foundVideoArchiveList){
        translateVideoArchiveListToApiResponse(user._id, deviceId, foundVideoArchiveList)
          .then(function(translatedVideoArchiveList){
            resolve(translatedVideoArchiveList)
          })
          .catch(function(err){
            reject(err);
          })
      })
      .catch(function(err){
        reject(err);
      })
  });

}

exports = module.exports = function(){

  //device
  this.getAllDeviceByUser = getAllDeviceByUser;
  this.getDeviceByUser = getDeviceByUser;
  this.setDeviceSatus = setDeviceSatus;
  this.getAllDeviceLog = getAllDeviceLog;

  //user
  this.singup = singup;
  this.updateUserInfo = updateUserInfo;
  this.increaseCredit = increaseCredit;

  //location
  this.getAllLocation = getAllLocation;
  this.addLocation = addLocation;
  this.assignLocation = assignLocation;

  this.setAlarmStatus = setAlarmStatus;

  this.getAllUserLog = getAllUserLog;

  //archive
  this.getAllDeviceArchive = getAllDeviceArchive;
  this.getAllUserArchive = getAllUserArchive;
  this.getArchive = getArchive;
  this.getArchiveVideoFile = getArchiveVideoFile;
  this.getVideoListByDevice = getVideoListByDevice;
  this.deleteArchiveByDeviceImage = deleteArchiveByDeviceImage;

  //subscribver
  this.addSubscriber = addSubscriber;
  this.getAllSubscriberByDevice = getAllSubscriberByDevice;
  this.removeSubscriber = removeSubscriber;

  //image
  this.getImageContent = getImageContent;

  this.setupDevice = setupDevice;
  this.setDeviceInfo = setDeviceInfo;
  this.getAllActuatorByDevice = getAllActuatorByDevice;
  this.getAllSensorByDevice = getAllSensorByDevice;
  this.getAllDeviceType = getAllDeviceType;
  this.setIsMonitoring = setIsMonitoring;
  this.addNewSocketConnection = addNewSocketConnection;
  this.getSocketList = getSocketList;

  // Notify on Socket
  this.notifyUserOnSocket = notifyUserOnSocket;
  this.notifyNewImageUserOnSocket = notifyNewImageUserOnSocket;
  this.notifyNewLogOnSocket = notifyNewLogOnSocket;

  this.sendTokenToMobileNumber = sendTokenToMobileNumber;
  this.checkCodeWithMobileNumber = checkCodeWithMobileNumber;
  this.getAllImagesByActuator = getAllImagesByActuator;
  this.getImageListByDeviceByDate = getImageListByDeviceByDate;
  this.deleteImageByDeviceImage = deleteImageByDeviceImage;
  this.getLastImageData = getLastImageData;
  this.subscribeWebPush = subscribeWebPush;
  this.getAuthByAuthId = getAuthByAuthId;
  this.setActuatorIsAvtive = setActuatorIsAvtive;
  this.setSensorIsAvtive = setSensorIsAvtive;
};
