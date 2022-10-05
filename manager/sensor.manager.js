var Sensor;
var uuid;

function add(type, staus){
  var newSensor = new Sensor({
    registerDate: new Date(),
    manufactureId: uuid.v4(),
    type: type,
    staus: staus,
  });

  return newSensor.save();
}

function addAndAttach(type, device){
  var newSensor = new Sensor({
    registerDate: new Date(),
    manufactureId: uuid.v4(),
    type: type,
    device: device,
    status: 'attached'
  });

  return newSensor.save();
}

function attach(manufactureId, device){
  var query = {
    manufactureId: manufactureId,
  };

  var update = {
    device: device,
    status: 'attached'
  };

  return Sensor
    .findOneAndUpdate(query, update, {new: true})
    .populate('device');
}

function detach(manufactureId, device){
  var query = {
    manufactureId: manufactureId,
    device:device,
  };

  var update = {
    device: undefined,
    status: 'detach'
  };

  return Sensor
    .findOneAndUpdate(query, update, {new: true})
    .populate('device');
}

function get_manufactureId(manufactureId){
  var query = {
    manufactureId: manufactureId
  };

  return Sensor.findOne(query);
}

function getAll_device(device){
  var query = {
    device: device
  };

  return Sensor
    .find(query)
    .populate('device');
}

function setIsActive(device, sensorId, isActive){
  var query = {
    _id: sensorId,
    device: device,
  };

  var update = {
    isActive: isActive
  };

  return Sensor
    .findOneAndUpdate(query, update, {new: true})
    .populate('device');
}

function getActuatorByType(sensorList, type){
    let result = sensorList.find(function(sensor){
      if(sensor.type == type){
        return sensor;
      }
    });
    return result;
  }

function get_sensorId_device(device,sensorId){
  var query = {
    device: device,
    _id: sensorId
  };

  return Sensor
    .findOne(query)
    .populate('device');
}

function setIsActive_device_type(device, type, isActive){
  var query = {
    type: type,
    device: device,
  };

  var update = {
    isActive: isActive
  };

  return Sensor
    .findOneAndUpdate(query, update, {new: true})
    .populate('device');
}

function get_device_type(device, type){
  var query = {
    type: type,
    device: device,
  };

  return Sensor
    .findOne(query)
    .populate('device');
}

exports = module.exports = function(options){
  Sensor = options.sensorModel;
  uuid = options.uuid;

  this.add = add;
  this.addAndAttach = addAndAttach;
  this.attach = attach;
  this.detach = detach;
  this.get_manufactureId = get_manufactureId;
  this.getAll_device = getAll_device;
  this.get_device_type = get_device_type;
  this.setIsActive = setIsActive;
  this.setIsActive_device_type = setIsActive_device_type;
  this.getActuatorByType = getActuatorByType;
  this.get_sensorId_device = get_sensorId_device;
};
