var redisProvider;

function setDeviceLastImage(imageData){
  return redisProvider.set(`${imageData.deviceId.toString()}_${imageData.actuatorId.toString()}`,JSON.stringify(imageData));
}

function getDiveceLastImage(deviceId, actuatorId){
  return redisProvider.get(`${deviceId.toString()}_${actuatorId.toString()}`);
}

exports = module.exports = function(options){
  redisProvider = options.redisProvider;

  this.setDeviceLastImage = setDeviceLastImage;
  this.getDiveceLastImage = getDiveceLastImage;
}
