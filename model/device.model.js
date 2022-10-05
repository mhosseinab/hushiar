var mongoose = require('mongoose');

var DeviceSchema = new mongoose.Schema({
  registerDate : Date,
  title: String,
  manufactureId: String,
  type: String, //MobileApp,A1,A2
  status: String,//home, silentMonitoring, secureMonitoring
  isOn: Boolean,
  isMonitoring: Boolean,
  isOnAlarm: Boolean,
  isMoving: Boolean,
  isLightOn: Boolean,
  temperture: Number,
  user : {type: mongoose.Schema.Types.ObjectId, ref:'User'},
  location : {type: mongoose.Schema.Types.ObjectId, ref:'Location'},
  token: String,
  mqttUserName: String,
  mqttPassword: String,
});

module.exports = mongoose.model('Device',DeviceSchema);
