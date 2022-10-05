var fetch;

var URL_APP_NOTIFYUSER = '';
var URL_APP_NOTIFYUSER_NEW_IMAGE = '';
var URL_APP_NOTIFYUSER_NEW_LOG = '';

function notifyUserOnSocket(userId, deviceId,isOnAlarm){
  let data = {
    userId: userId,
    deviceId: deviceId,
    isOnAlarm: isOnAlarm,
  };

  let payload = {
    method: 'post',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  };

  return fetch(URL_APP_NOTIFYUSER, payload);

}

function notifyNewImageUserOnSocket(userId, deviceId,actuatorId){
  let data = {
    userId: userId,
    deviceId: deviceId,
    actuatorId: actuatorId,
  };

  let payload = {
    method: 'post',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  }
  return fetch(URL_APP_NOTIFYUSER_NEW_IMAGE, payload);
}

function notifyNewLogUserOnSocket(userId, deviceId, log){
  let data = {
    userId: userId,
    deviceId: deviceId,
    log: log,
  };

  let payload = {
    method: 'post',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  };

  return fetch(URL_APP_NOTIFYUSER_NEW_LOG, payload);
}





exports = module.exports = function(options){
  fetch = options.fetch;

  this.notifyUserOnSocket = notifyUserOnSocket;
  this.notifyNewImageUserOnSocket = notifyNewImageUserOnSocket;
  this.notifyNewLogUserOnSocket = notifyNewLogUserOnSocket;

};
