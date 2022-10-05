var Actuator;
var uuid;

function add(type, staus){
  var newActuator = new Actuator({
    registerDate: new Date(),
    manufactureId: uuid.v4(),
    type: type,
    staus: staus
  });

  return newActuator.save();
}

function addAndAttach(type, device){
  var newActuator = new Actuator({
    registerDate: new Date(),
    manufactureId: uuid.v4(),
    type: type,
    device: device,
    staus: 'attached'
  });

  return newActuator.save();
}

function assignDevice(manufactureId, device){
  var query = {
    manufactureId: manufactureId,
  };

  var update = {
    device: device,
  };

  return Actuator
    .findOneAndUpdate(query, update, {new: true})
    .populate('device');
}

function getAll_device(device){
  var query = {
    device: device
  };

  return Actuator
    .find(query)
    .populate('device');
}

function get_manufactureId_device(device, manufactureId){
  var query = {
    device: device,
    manufactureId: manufactureId
  };

  return Actuator.findOne(query);
}

function get_device_type(device, type){
  var query = {
    device: device,
    type: type
  };

  return Actuator.findOne(query);
}

function get_actuatorId_device(device,actuatorId){
  var query = {
    device: device,
    _id: actuatorId
  };

  return Actuator.findOne(query).populate('device');
}

function setIsActive(device, actuatorId, isActive){
  var query = {
    _id: actuatorId,
    device: device,
  };

  var update = {
    isActive: isActive
  };

  return Actuator
    .findOneAndUpdate(query, update, {new: true})
    .populate('device');
}

function getActuatorByType(actuatorList, type){
    let result = actuatorList.find(function(actuator){
      if(actuator.type == type){
        return actuator;
      }
    });
    return result;
  }

function setIsActive_device_type(device, type, isActive){
  var query = {
    type: type,
    device: device,
  };

  var update = {
    isActive: isActive
  };

  return Actuator
    .findOneAndUpdate(query, update, {new: true})
    .populate('device');
}

exports = module.exports = function(options){
  Actuator = options.actuatorModel;
  uuid = options.uuid;

  this.add = add;
  this.addAndAttach = addAndAttach;

  this.assignDevice = assignDevice;
  this.setIsActive = setIsActive;
  this.setIsActive_device_type = setIsActive_device_type;
  this.get_manufactureId_device = get_manufactureId_device;
  this.get_actuatorId_device = get_actuatorId_device;
  this.get_device_type = get_device_type;
  this.getAll_device = getAll_device;
  this.getActuatorByType = getActuatorByType;
};
