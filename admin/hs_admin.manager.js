
var iocFile = require('../manager/ioc.manager.js');
var ioc = new iocFile();

function addDevice(title, type){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.add(title, type, 'home')
      .then(function(createdDevice){
        ioc.manager.sensor.addAndAttach('Detector',createdDevice)
          .then(function(createdAttachedSensor){
              let actuatorTypeList = ['Buzzer','Beacon','Capture'];
              let addActuatorPromiseList = actuatorTypeList.map(function(actuatorType){
                return ioc.manager.actuator.addAndAttach(actuatorType, createdDevice)
              });
              Promise.all(addActuatorPromiseList)
                .then(function(createdActuatorList){
                    resolve(createdDevice);
                })
                .catch(function(err){
                  reject(err);
                })
          })
      })
      .catch(function(err){
        reject(err);
      })
  });


}

function deviceConfigList(){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.getAll()
      .then(function(foundDeviceList){
        let convertedDeviceList = foundDeviceList.map(function(device){
          return {
            manufactureId: device.manufactureId,
            mqttUserName: device.mqttUserName,
            mqttPassword: device.mqttPassword,
          }
        })
        resolve(convertedDeviceList);
      })
      .catch(function(err){
        reject(err);
      })
  });
}

function getAllDeviceList(){
  return ioc.manager.device.getAll();
}

function downloadDeviceConfigList(){
  return new Promise(function(resolve, reject) {
    ioc.manager.device.getAll()
      .then(function(foundDeviceList){
        let convertedDeviceListContent = '';
        for (var device of foundDeviceList) {
          convertedDeviceListContent = convertedDeviceListContent + `manufactureId: ${device.manufactureId} | mqttUserName: ${device.mqttUserName} | mqttPassword: ${device.mqttPassword}\n`
        }
        resolve(convertedDeviceListContent);
      })
      .catch(function(err){
        reject(err);
      })
  });
}

function addSensor(manufactureId, type){
  return ioc.manager.sensor.add(manufactureId, type, 'InStock');
}

function addActuator(manufactureId, type){
  return ioc.manager.actuator.add(manufactureId, type, 'InStock');
}

function getAllImageList(){
  return ioc.manager.image.getAll();
}

function getAllImageListByDevice(deviceId){
  return ioc.manager.image.getAll_device(deviceId);
}

function getUserList(){
  return ioc.manager.user.getAll();
}

function notifyUser(userId, title, message){
  return ioc.manager.user.webPushNotifyMessage(userId, title, message);
}

// Log
function removeAllLogByDevice(deviceId){
  return ioc.manager.log.removeByDevice(deviceId);
}

// Archive
function removeAllArchiveByDevice(deviceId){
  return ioc.manager.archive.removeByDevice(deviceId);
}

exports = module.exports = function(){
  //Device
  this.addDevice = addDevice;
  this.getAllDeviceList = getAllDeviceList;
  this.deviceConfigList = deviceConfigList;
  this.downloadDeviceConfigList = downloadDeviceConfigList;

  //Log
  this.removeAllLogByDevice = removeAllLogByDevice;

  //ARCHIVE
  this.removeAllArchiveByDevice = removeAllArchiveByDevice;

  this.addSensor = addSensor;


  this.addActuator = addActuator;

  this.getAllImageList = getAllImageList;
  this.getAllImageListByDevice = getAllImageListByDevice;

  //user
  this.getUserList = getUserList;
  this.notifyUser = notifyUser;
};
