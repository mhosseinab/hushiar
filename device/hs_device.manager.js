

var iocFile = require('../manager/ioc.manager.js');
var ioc = new iocFile();

const fs = require("fs");

ioc.manager.mqtt.setSubscribtionCallBackFunction(newMessageOnMqtt);
ioc.manager.mqtt.setRegisterDeviceCallBackFunction(registerDeviceToken);
ioc.manager.mqtt.setUploadImageCallBackFunction(storeImage);
ioc.manager.mqtt.setMovingCallBackFunction(movingStatusChanged);

ioc.manager.motionDetector.setOnMoteionDetectedCallBackFunction(imageProcessingMotionDetection);




function imageProcessingMotionDetection(device,fromImage,toImage){
  console.log('!!!!!!!Motion Detected');
  movingStatusChanged({token: device.token}, true);
}



function ingestVerbose(deviceManufactureId, data){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.get_manufactureId(deviceManufactureId)
      .then(function(foundDevice){
        if(foundDevice){
          ioc.manager.verbose.ingest(foundDevice, data)
            .then(function(createdVerbose){
              resolve(createdVerbose);
            })
            .catch(function(err){
              reject(err);
            });
        }else{
          var noDeviceFoundWithManufactureIdError = new Error('Device Not Found With manufactureId '+ deviceManufactureId);
          reject(noDeviceFoundWithManufactureIdError);
        }
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function attachSensor(deviceManufactureId, sensorManufactureId){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.get_manufactureId(deviceManufactureId)
      .then(function(foundDevice){
        if(foundDevice){
          ioc.manager.sensor.attach(sensorManufactureId, foundDevice)
            .then(function(updatedSensor){
              if(updatedSensor){
                resolve(updatedSensor);
              }else{
                var noSensorFoundWithManufactureIdError = new Error('Sensor Not Found With manufactureId '+ sensorManufactureId);
                reject(noSensorFoundWithManufactureIdError);
              }
            })
            .catch(function(err){
              reject(err);
            });
        }else{
          var noDeviceFoundWithManufactureIdError = new Error('Device Not Found With manufactureId '+ deviceManufactureId);
          reject(noDeviceFoundWithManufactureIdError);
        }
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function detachSensor(deviceManufactureId, sensorManufactureId){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.get_manufactureId(deviceManufactureId)
      .then(function(foundDevice){
        if(foundDevice){
          ioc.manager.sensor.detach(sensorManufactureId, foundDevice)
            .then(function(updatedSensor){
              if(updatedSensor){
                resolve(updatedSensor);
              }else{
                var noSensorFoundWithManufactureIdError = new Error('Sensor Not Found With manufactureId '+ sensorManufactureId);
                reject(noSensorFoundWithManufactureIdError);
              }
            })
            .catch(function(err){
              reject(err);
            });
        }else{
          var noDeviceFoundWithManufactureIdError = new Error('Device Not Found With manufactureId '+ deviceManufactureId);
          reject(noDeviceFoundWithManufactureIdError);
        }
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function attachActuator(deviceManufactureId, actuatorManufactureId){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.get_manufactureId(deviceManufactureId)
      .then(function(foundDevice){
        if(foundDevice){
          ioc.manager.actuator.attach(actuatorManufactureId, foundDevice)
            .then(function(updatedActuator){
              if(updatedActuator){
                resolve(updatedActuator);
              }else{
                var noActuatorrFoundWithManufactureIdError = new Error('Actuator Not Found With manufactureId '+ actuatorManufactureId);
                reject(noActuatorrFoundWithManufactureIdError);
              }
            })
            .catch(function(err){
              reject(err);
            });
        }else{
          var noDeviceFoundWithManufactureIdError = new Error('Device Not Found With manufactureId '+ deviceManufactureId);
          reject(noDeviceFoundWithManufactureIdError);
        }
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function detachActuator(deviceManufactureId, actuatorManufactureId){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.get_manufactureId(deviceManufactureId)
      .then(function(foundDevice){
        if(foundDevice){
          ioc.manager.actuator.detach(actuatorManufactureId, foundDevice)
            .then(function(updatedActuator){
              if(updatedActuator){
                resolve(updatedActuator);
              }else{
                var noActuatorrFoundWithManufactureIdError = new Error('Actuator Not Found With manufactureId '+ actuatorManufactureId);
                reject(noActuatorrFoundWithManufactureIdError);
              }
            })
            .catch(function(err){
              reject(err);
            });
        }else{
          var noDeviceFoundWithManufactureIdError = new Error('Device Not Found With manufactureId '+ deviceManufactureId);
          reject(noDeviceFoundWithManufactureIdError);
        }
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function ingestLog(deviceManufactureId, logData){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.get_manufactureId(deviceManufactureId)
      .then(function(foundDevice){
        if(foundDevice){
          ioc.manager.log.ingest(foundDevice, logData)
            .then(function(insertedLog){
              resolve(insertedLog);
            })
            .catch(function(err){
              reject(err);
            });
        }else{
          var noDeviceFoundWithManufactureIdError = new Error('Device Not Found With manufactureId '+ deviceManufactureId);
          reject(noDeviceFoundWithManufactureIdError);
        }
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function setDeviceOnAlarmState(deviceManufactureId, isOnAlarm){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.setIsOnAlarm(deviceManufactureId, isOnAlarm)
      .then(function(updatedDevice){
        if(updatedDevice){
          resolve(updatedDevice);
        }else{
          var noDeviceFoundWithManufactureIdError = new Error('Device Not Found With manufactureId '+ deviceManufactureId);
          reject(noDeviceFoundWithManufactureIdError);
        }
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function getAllNewCommands(deviceManufactureId){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.get_manufactureId(deviceManufactureId)
      .then(function(foundDevice){
        if(foundDevice){
          ioc.manager.command.getAll_device_isDone(foundDevice, false)
            .then(function(foundCommandList){
              resolve(foundCommandList);
            })
            .catch(function(err){
              reject(err);
            });
        }else{
          var noDeviceFoundWithManufactureIdError = new Error('Device Not Found With manufactureId '+ deviceManufactureId);
          reject(noDeviceFoundWithManufactureIdError);
        }
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function setCommandExecuteResult(deviceManufactureId, commandId, isDone){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.get_manufactureId(deviceManufactureId)
      .then(function(foundDevice){
        if(foundDevice){
          ioc.manager.command.setExecutionResult(foundDevice, commandId, isDone)
            .then(function(updatedCommand){
              resolve(updatedCommand);
            })
            .catch(function(err){
              reject(err);
            });
        }else{
          var noDeviceFoundWithManufactureIdError = new Error('Device Not Found With manufactureId '+ deviceManufactureId);
          reject(noDeviceFoundWithManufactureIdError);
        }
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function mvpIngest(query){

  var deviceManufactureId = '123a1df23fdsa12zxcv3h1re23';
  var detectorManufactureId = '123aqa1df23fdiiiiewdsf12zxcv3h1re23'

  var detectorLogData = {
    type: 'Detector',
    manufactureId : detectorManufactureId,
    isMoving: query.move,
  };

  // console.log(detectorLogData);

  var temperatureLogData = {
    type: 'Temperature',
    manufactureId: '123ammmma1df23fdsaewdsf12zxcv3h1re23',
    value: query.temp,
  };

  // console.log(temperatureLogData);



  return new Promise(function(resolve, reject) {
    ioc.manager.device.get_manufactureId(deviceManufactureId)
      .then(function(foundDevice){
        if(foundDevice){
          ingestLog(deviceManufactureId,detectorLogData);
          ingestLog(deviceManufactureId,temperatureLogData);

          // ioc.manager.influx.write()
          //   .then(function(response){
          //     console.log('+++++++++++++++++++++');
          //     console.log(reponse);
          //   })
          //   .catch(function(err){
          //     console.log('+++++++++++++++++++++');
          //     console.log(err);
          //   });

          var isMovingValue = undefined;
          if(query.move == 'false'){
            isMovingValue = false;
          }else if(query.move == 'true'){
            isMovingValue = true;
          }


          var isOnAlarmValue = undefined;
          if(query.isOnAlarm=='false'){
            isOnAlarmValue = false;
          }else if(query.move == 'true'){
            isMovingValue = true;
          }

          var isLightOnValue = undefined;
          if(query.lightOne == 'false'){
            isLightOnValue = false;
          }else if(query.lightOne == 'true'){
            isLightOnValue = true;
          };

          var tempertureValue = undefined;
          if(query.temp){
            tempertureValue = parseInt(query.temp)
          };

          //check for change
          ioc.manager.device.setNewStatus(foundDevice._id,isMovingValue, isOnAlarmValue , isLightOnValue , tempertureValue)
          //setDeviceOnAlarmState(deviceManufactureId, query.move)
            .then(function(updattedDevice){
              if(updattedDevice.isOnAlarm != foundDevice.isOnAlarm){
                console.log('w w w w are here');
                ioc.manager.apiBus.notifyUserOnSocket(foundDevice.user._id, foundDevice._id,updattedDevice.isOnAlarm)
                  .then(function(response){
                    //console.log(response);
                  })
                  .catch(function(err){
                    console.log(err);
                  });
              }
              console.log(updattedDevice.isMoving +'<><><>' + isMovingValue);
              if(foundDevice.isMoving != isMovingValue){
                ioc.manager.sensor.get_manufactureId(detectorManufactureId)
                  .then(function(foundSensor){
                    if(foundSensor){

                      console.log('w w w w are here');
                      ioc.manager.apiBus.notifyUserOnSocket(foundDevice.user._id, foundDevice._id,updattedDevice.isOnAlarm)
                        .then(function(response){
                          //console.log(response);
                        })
                        .catch(function(err){
                          console.log(err);
                        });

                      if(isMovingValue){
                        //start
                        console.log('!!!!!!!!!!!Start Archive');
                        ioc.manager.archive.startMoving(updattedDevice, foundSensor)
                          .then(function(startedArchive){
                            console.log(startedArchive);
                          })
                          .catch(function(err){
                            console.log(err);
                          });
                      }else{
                        //end
                        console.log('!!!!!!!!!!!!!!!!!End Archive');
                        ioc.manager.archive.endMoving(updattedDevice, foundSensor)
                          .then(function(endedArchive){
                            console.log(endedArchive);
                          })
                          .catch(function(err){
                            console.log(err);
                          });
                      }
                    }else{
                      reject(new Error('No sensor found with mangufacutre Id : '+ detectorManufactureId));
                    }
                  })
                  .catch(function(err){
                    reject(err);
                  })

              }

              //get All actuator List
              // get active status
              // generate resposnse

              ioc.manager.actuator.getAll_device(updattedDevice)
                .then(function(foundActuatorList){
                  var mvpResult = {
                    onAlarm: false,
                    lightOne:false,
                    setLight:false,
                    isMonitoring: true,
                    setMonitoring:true,
                    isRecording: false,
                    setRecording: false,
                    isBuzzerActive: false,
                    setBuzzerActive: false,
                    isHazardBeaconActive: false,
                    setHazardBeacon: false,
                    commnads:[],
                  };

                  let captureActuator = ioc.manager.actuator.getActuatorByType(foundActuatorList,"Capture");
                  let lightActuator = ioc.manager.actuator.getActuatorByType(foundActuatorList,"Light");
                  let buzzerActuator = ioc.manager.actuator.getActuatorByType(foundActuatorList,"Buzzer");
                  let hazardBeaconActuator = ioc.manager.actuator.getActuatorByType(foundActuatorList,"hazardBeacon");

                  if(captureActuator){
                    mvpResult.isRecording = captureActuator.isActive;
                    mvpResult.setRecording = captureActuator.isActive;
                    let captureActuatorCommand = {
                      manufactureId: captureActuator.manufactureId,
                      isAlive:captureActuator.isActive
                    };
                    mvpResult.commnads.push(captureActuatorCommand);
                  }

                  if(lightActuator){
                    mvpResult.lightOne = lightActuator.isActive;
                    mvpResult.setLight = lightActuator.isActive;
                    let lightActuatorCommand = {
                      manufactureId: lightActuator.manufactureId,
                      isAlive:lightActuator.isActive
                    };
                    mvpResult.commnads.push(lightActuatorCommand);
                  }

                  if(buzzerActuator){
                    mvpResult.isBuzzerActive = buzzerActuator.isActive;
                    mvpResult.setBuzzerActive = buzzerActuator.isActive;
                    let buzzerActuatorCommand = {
                      manufactureId: buzzerActuator.manufactureId,
                      isAlive:buzzerActuator.isActive
                    };
                    mvpResult.commnads.push(buzzerActuatorCommand);
                  }

                  if(hazardBeaconActuator){
                    mvpResult.isHazardBeaconActive = hazardBeaconActuator.isActive;
                    mvpResult.setHazardBeacon = hazardBeaconActuator.isActive;
                    let hazardBeaconActuatorCommand = {
                      manufactureId: hazardBeaconActuator.manufactureId,
                      isAlive:hazardBeaconActuator.isActive
                    };
                    mvpResult.commnads.push(hazardBeaconActuatorCommand);
                  }

                  ioc.manager.sensor.getAll_device(updattedDevice)
                    .then(function(foundSensorList){

                        let motionDetectorSensor = ioc.manager.sensor.getActuatorByType(foundSensorList,"motionDetector");

                        if(motionDetectorSensor){
                          mvpResult.isMonitoring = motionDetectorSensor.isActive;
                          mvpResult.setMonitoring = motionDetectorSensor.isActive;
                          let motionDetectorSensorCommand = {
                            manufactureId: motionDetectorSensor.manufactureId,
                            isAlive:motionDetectorSensor.isActive
                          };
                          mvpResult.commnads.push(motionDetectorSensorCommand);
                        }
                        mvpResult.commnads =[];
                        resolve(mvpResult);
                    })
                    .catch(function(err){
                      reject(err);
                    });

                })
                .catch(function(err){
                  reject(err);
                });


            })
            .catch(function(err){
              reject(err);
            });
        }else{
          var noDeviceFoundWithManufactureIdError = new Error('Device Not Found With manufactureId '+ deviceManufactureId);
          reject(noDeviceFoundWithManufactureIdError);
        }
      })
      .catch(function(err){
        reject(err);
      });
  });

}

function processNotifyNewIsOnAlaram(device){

}

function captureImage(file,deviceManufactureId, actuatorManufactureId){
  return new Promise(function(resolve, reject) {
    // TODO: change to systemLog insted of log

    // var captureLogData = {
    //   type: 'Capture',
    //   manufactureId: actuatorManufactureId,
    //   value: file,
    // };
    // ingestLog(deviceManufactureId,captureLogData)
    //   .then(function(insertedLog){
    //     var data = {
    //       log: insertedLog
    //     };
    //   })
    //   .catch(function(err){
    //     processError(res, err);
    //   });

    ioc.manager.device.get_manufactureId(deviceManufactureId)
      .then(function(foundDevice){
          if(foundDevice){
            ioc.manager.actuator.get_manufactureId_device(foundDevice, actuatorManufactureId)
              .then(function(foundActuator){
                if(foundActuator){
                    ioc.manager.image.create(file.filename, file, foundDevice, foundActuator)
                      .then(function(savedImage){

                        ioc.manager.apiBus.notifyNewImageUserOnSocket(foundDevice.user._id, foundDevice._id,foundActuator._id)
                          .then(function(response){
                            //console.log(response);
                          })
                          .catch(function(err){
                            console.log(err);
                          });
                        resolve(savedImage);
                      })
                      .catch(function(err){
                        reject(err);
                      });
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

function storeImage(deviceToken, imageContent){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.get_token(deviceToken)
      .then(function(foundDevice){
        if(foundDevice){
          ioc.manager.actuator.get_device_type(foundDevice, 'Capture')
            .then(function(foundActuator){
              if(foundActuator){
                let userId = foundDevice.user._id.toString();
                let deviceId = foundDevice._id.toString();
                ioc.manager.image.storeImage(userId, deviceId, imageContent)
                  .then(function(storedImageFileInfo){

                    // TODO: Change to System Log insted of log
                    // var captureLogData = {
                    //   type: 'Capture',
                    //   manufactureId: foundActuator.manufactureId,
                    //   value: storedImageFileInfo.file,
                    // };
                    // ingestLog(foundDevice.manufactureId,captureLogData)
                    //   .then(function(insertedLog){
                    //     var data = {
                    //       log: insertedLog
                    //     };
                    //   })
                    //   .catch(function(err){
                    //     console.log(err);
                    //     processError(res, err);
                    //   });

                      ioc.manager.image.create(storedImageFileInfo.filename, storedImageFileInfo, foundDevice, foundActuator)
                        .then(function(savedImage){
                          ioc.manager.log.imageCaptured(foundDevice, savedImage._id);
                          ioc.manager.motionDetector.addNewImage(savedImage);

                          // herrer to add to memeory storage
                          let imageFilePath = ioc.manager.image.getImagePathWithFileName(userId, deviceId, savedImage.fileName);
                          ioc.manager.image.getBase64FromPath(imageFilePath)
                            .then(function(imageContent){
                              let imageData = {
                                _id: savedImage._id,
                                contentBase46: imageContent,
                                registerDate: savedImage.registerDate,
                                deviceId: foundDevice._id,
                                actuatorId: foundActuator._id,
                              }
                              ioc.manager.memStorage.setDeviceLastImage(imageData);
                            })
                            .catch(function(err){
                              console.log(err);
                            })


                          // fs.readFile(imageFilePath,{ encoding: 'base64' }, (err, imageContent) => {
                          //   if (err) {
                          //     console.log(err);
                          //   }
                          //   let imageData = {
                          //     _id: savedImage._id,
                          //     contentBase46: imageContent,
                          //     registerDate: savedImage.registerDate,
                          //     deviceId: foundDevice._id,
                          //     actuatorId: foundActuator._id,
                          //   }
                          //   ioc.manager.memStorage.setDeviceLastImage(imageData);
                          // });


                          // ioc.manager.apiBus.notifyNewImageUserOnSocket(foundDevice.user._id, foundDevice._id,foundActuator._id)
                          //   .then(function(response){
                          //     //console.log(response);
                          //   })
                          //   .catch(function(err){
                          //     console.log(err);
                          //   });
                        })
                        .catch(function(err){
                          console.log(err);
                          reject(err);
                        })

                  })
                  .catch(function(err){
                    console.log(err);
                    reject(err);
                  });
              }else{
                let errorMessage = "No capture actuator found for device " + foundDevice._id;
                console.log(errorMessage);
                rejecet(new Error(errorMessage));
              }
            })
            .catch(function(err){
              console.log(err);
              rejecet(err);
            });


        }else{
          let errorMesaage = 'No Device Found With token ' + deviceToken;
          console.log(errorMesaage);
          reject(new Error(errorMesaage));
        }
      })
      .catch(function(err){
        reject(err);
      });
  });
}

function movingStatusChanged(translatedTopic, value){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.get_token(translatedTopic.token)
      .then(function(foundDevice){
        if(foundDevice){

          if(
            value == true &&
            foundDevice.status != 'home'
          ){

            ioc.manager.log.moving(foundDevice)
              .then(function(insertedLog){
                console.log(insertedLog);
                let cloneLog = {
                  _id: insertedLog._id,
                  type: insertedLog.type,
                  registerDate: insertedLog.registerDate
                };
                ioc.manager.apiBus.notifyNewLogUserOnSocket(foundDevice.user._id, foundDevice._id, cloneLog)
                  .then(function(response){
                    console.log(response);
                  })
                  .catch(function(err){
                    console.log(err);
                  });
              })
              .catch(function(err){
                console.log(err);
              });

            ioc.manager.user.webPushNotify(foundDevice.user._id, foundDevice)
              .then(function(response){
                console.log(response);
              })
              .catch(function(err){
                console.log(err);
              });

            ioc.manager.apiBus.notifyUserOnSocket(foundDevice.user._id, foundDevice._id,value)
              .then(function(response){
                console.log(response);
              })
              .catch(function(err){
                console.log(err);
              });


            ioc.manager.notify.sendMovingAlert(foundDevice.user, foundDevice.title)
              .then(function(smsResponse){
                console.log(smsResponse);
              })
              .catch(function(err){
                console.log(err);
              });


          }

        }else{
          reject(new Error('No Device Found By token : ' + translatedTopic.token));
        }
      })
      .catch(function(err){
        reject(err);
      })
  });
}

function newMessageOnMqtt(translatedTopic, message){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.get_token(translatedTopic.token)
      .then(function(foundDevice){
          if(foundDevice){
            if(translatedTopic.method == 'action'){
              ioc.manager.actuator.setIsActive_device_type(foundDevice, translatedTopic.type, message)
                .then(function(updatedActuator){
                  if(updatedActuator){
                    console.log('Actuator isActive updated');
                    resolve(updatedActuator);
                  }else{
                    ioc.manager.sensor.setIsActive_device_type(foundDevice, translatedTopic.type, message)
                      .then(function(updatedSensor){
                        if(updatedSensor){
                          console.log('Sensor isActive updated');
                          resolve(updatedSensor);
                        }else{
                          reject(new Error('No Actutator or Sensor Found on device'));
                        }
                      })
                      .catch(function(err){
                        console.log(err);
                        reject(err);
                      });
                  }
                })
                .catch(function(err){
                  console.log(err);
                  reject(err);
                });

            }else if(translatedTopic.sensorManufactureId){
              console.log('this a sensor mqtt message');
            }

          }else{
            reject(new Error('No Device Found By token : ' + translatedTopic.token));
          }
      })
      .catch(function(err){
        console.log(err);
        reject(err);
      });
  });


}

function registerDeviceToken(deviceManufactureId){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.generateToken(deviceManufactureId)
      .then(function(updatedDevice){
        if(updatedDevice){


          ioc.manager.mqtt.subscribeDeviceTopic(updatedDevice.token)
            .then(function(mqttSubscribtionResult){
              console.log(mqttSubscribtionResult);
              let result = {
                type:'mqtt',
                mqttBroker:'mqtt://broker.hivemq.com',
                token:updatedDevice.token
              };

              ioc.manager.mqtt.setToken(updatedDevice.manufactureId, updatedDevice.token);

              ioc.manager.actuator.getAll_device(updatedDevice)
                .then(function(foundActuatorList){
                  ioc.manager.sensor.getAll_device(updatedDevice)
                    .then(function(foundSensorList){

                      setTimeout(function(){
                        foundSensorList.forEach(function(sensor){
                          console.log(`sensor status :: ${sensor.type}->${sensor.isActive}`);
                          ioc.manager.mqtt.setStatus(updatedDevice.token, sensor.type ,sensor.isActive);
                        });
                        foundActuatorList.forEach(function(actuator){
                          console.log(`actuator status :: ${actuator.type}->${actuator.isActive}`);
                          ioc.manager.mqtt.setStatus(updatedDevice.token, actuator.type ,actuator.isActive);
                        });
                        ioc.manager.mqtt.setResolution(updatedDevice.token, 7);

                        ioc.manager.log.getToken(updatedDevice)
                          .then(function(insertedLog){
                            console.log(insertedLog);
                          })
                          .catch(function(err){
                            console.log(err);
                          });

                      },2000, this)
                      resolve(result);
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
            });

        }else{
          let errorMessage = 'No Device Found'
          console.log(errorMesaage);
          reject(new Error(errorMessage));
        }
      })
      .catch(function(err){
        console.log(err);
        reject(err);
      });
  });
}

function deviceListMqttSubscribeAll(){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.getAll()
      .then(function(foundDeviceList){
        foundDeviceList.forEach((device, i) => {
          ioc.manager.mqtt.subscribeDeviceTopic(device.token)
        });
        resolve('deviceListMqttSubscribeAll :: done');
      })
      .catch(function(err){
          console.log(err);
          reject(err);
      })
  });
}


exports = module.exports = function(){
  this.attachSensor = attachSensor;
  this.detachSensor = detachSensor;
  this.attachActuator = attachActuator;
  this.detachActuator = detachActuator;
  this.ingestLog = ingestLog;
  this.setDeviceOnAlarmState = setDeviceOnAlarmState;
  this.getAllNewCommands = getAllNewCommands;
  this.setCommandExecuteResult = setCommandExecuteResult;
  this.mvpIngest = mvpIngest;
  this.captureImage = captureImage;
  this.ingestVerbose = ingestVerbose;
  this.registerDeviceToken = registerDeviceToken;

  deviceListMqttSubscribeAll();
};
