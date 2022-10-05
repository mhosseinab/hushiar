var Device;
var uuid;

function randomSecret(){
  var chars = ["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz","0123456789!~$&*_=+-", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"];
  var randPwd = [4,4,4].map(function(len, i) { return Array(len).fill(chars[i]).map(function(x) { return x[Math.floor(Math.random() * x.length)] }).join('') }).concat().join('').split('').sort(function(){return 0.5-Math.random()}).join('');
  return randPwd;
}

function add(title, type, status) {
  var newDevice = new Device({
    manufactureId: uuid.v4(),
    type: type,
    registerDate: new Date(),
    status: status,
    title: title,
    mqttUserName: randomSecret(),
    mqttPassword: randomSecret(),
  });

  return newDevice.save();
}

function assignLocation(location, manufactureId){
  var query = {
    manufactureId: manufactureId,
  };

  var update = {
    location: location,
  };

  return Device
    .findOneAndUpdate(query, update, {new: true});
}


function getAll(){
  var query = {};

  return Device.find(query).populate('user location');
}

function getAll_user(user){
  var query = {
    user: user
  };

  return Device.find(query).populate('user location');
}

function get_user(user, deviceId){
  var query = {
    _id: deviceId,
    user: user
  };

  return Device.findOne(query).populate('user');
}

function setup(user, manufactureId){
  var query = {
    manufactureId: manufactureId,
  };

  var update = {
    user: user,
  };

  return Device
    .findOneAndUpdate(query, update, {new: true});
}

function setStatus(deviceId, status){
  var query = {
    _id: deviceId,
  };


  var update = {
    status: status,
  };

  return Device
    .findOneAndUpdate(query, update, {new: true});
}

function get_manufactureId(manufactureId){
  var query = {
    manufactureId: manufactureId,
  };


  return Device
    .findOne(query)
    .populate('user');
}

function setInfo(deviceId, title, location){
  var query = {
    _id: deviceId,
  };


  var update = {
    title: title,
    location: location
  };

  return Device
    .findOneAndUpdate(query, update, {new: true});
}

function setIsOnAlarm(manufactureId, isOnAlarm){
  var query = {
    manufactureId: manufactureId,
  };

  var update = {
    isOnAlarm: isOnAlarm,
  };

  return Device
    .findOneAndUpdate(query, update, {new: true});
}

function setIsOnAlarmById(deviceId, isOnAlarm){
  var query = {
    _id: deviceId,
  };

  var update = {
    isOnAlarm: isOnAlarm,
  };

  return Device
    .findOneAndUpdate(query, update, {new: true});
}

function setIsMonitoring(deviceId, isMonitoring){
  var query = {
    _id: deviceId,
  };

  var update = {
    isMonitoring: isMonitoring,
  };

  return Device
    .findOneAndUpdate(query, update, {new: true});
}

function setNewStatus(deviceId, isMoving, isOnAlarm , isLightOn , temperture){
  var query = {
    _id: deviceId,
  };

  var update = {
    isMoving: isMoving,
    isOnAlarm: isOnAlarm,
    isLightOn: isLightOn,
    temperture: temperture,
  };

  return Device
    .findOneAndUpdate(query, update, {new: true});
}

function setIsMoving(deviceId, isMoving){
  var query = {
    _id: deviceId,
  };

  var update = {
    isMoving: isMoving,
  };

  return Device
    .findOneAndUpdate(query, update, {new: true});
}

function get_token(token){
  var query = {
    token: token,
  };


  return Device
    .findOne(query)
    .populate('user');
}

function generateToken(manufactureId){
  var query = {
    manufactureId: manufactureId,
  };

  var update = {
    token: uuid.v4(),
  };

  return Device
    .findOneAndUpdate(query, update, {new: true});
}

exports = module.exports = function(options){
  Device = options.deviceModel;
  uuid = options.uuid;

  this.assignLocation = assignLocation;
  this.add = add;
  this.getAll = getAll;
  this.getAll_user = getAll_user;
  this.get_user = get_user;
  this.get_manufactureId = get_manufactureId;
  this.setStatus = setStatus;
  this.setIsOnAlarm = setIsOnAlarm;
  this.setIsMoving = setIsMoving;
  this.setIsOnAlarmById = setIsOnAlarmById;
  this.setup = setup;
  this.setInfo = setInfo;
  this.setIsMonitoring = setIsMonitoring;
  this.setNewStatus = setNewStatus;
  this.get_token = get_token;
  this.generateToken = generateToken;
};
