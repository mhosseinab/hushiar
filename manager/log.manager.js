var Log;
var influxProvider;

function ingest(device, logData, type){
  var newLog = new Log({
    type: type,
    registerDate: new Date(),
    device: device,
    logData: logData,
  });

  return newLog.save();
}

function getAll_device(device){
  var query = {
    device:device,
    type:{$nin: ['imageCaptured']}
  };

  return Log
    .find(query)
    .sort({'registerDate': -1})
    .limit(40);
}



function getAll_deviceList(deviceList){
  var query = {
    device:{$in:deviceList},
  };

  return Log
    .find(query)
    .sort({'registerDate': -1})
    .limit(40);
}



function moving(device){
  let logData = {
    type: 'moving'
  };
  influxProvider.writeBoolean('movment',device._id, 'moving', true);
  return ingest(device, logData, 'moving');
}

function addSubscriber(device,title){
  let logData = {
    type: 'addSubscriber',
    title: title
  };
  return ingest(device, logData, 'addSubscriber');
}

function deviceStatusChanged(device){
  let logData = {
    type: 'changeMode',
    deviceStatus: device.status
  };
  influxProvider.writeString('changeMode',device._id, 'status', device.status);
  return ingest(device, logData, 'changeMode');
}

function videoArchived(device, archiveId){
  let logData = {
    type: 'videoArchive',
    archiveId: archiveId
  };
  return ingest(device, logData, 'videoArchive');
}

function imageCaptured(device,imageId){
  let logData = {
    type: 'imageCaptured',
    imageId: imageId,
  };

  influxProvider.writeBoolean('captureImage',device._id, 'capturing', true);
  return ingest(device, logData, 'imageCaptured');
}

function getToken(device){
  let logData = {
    type: 'getToken',
  };

  influxProvider.writeBoolean('registraion',device._id, 'getToken', true);
  return ingest(device, logData, 'getToken');
}

function removeByDevice(deviceId){
  var query = {
    device: deviceId
  };

  return Log.deleteMany(query, {rawResult:true});
}

exports = module.exports = function(options){
  Log = options.logModel;
  influxProvider = options.influxProvider;

  this.ingest = ingest;
  this.moving = moving;
  this.addSubscriber = addSubscriber;
  this.deviceStatusChanged = deviceStatusChanged;
  this.imageCaptured = imageCaptured;
  this.videoArchived = videoArchived;
  this.getAll_device = getAll_device;
  this.getAll_deviceList = getAll_deviceList;
  this.getToken = getToken;
  this.removeByDevice = removeByDevice;
};
