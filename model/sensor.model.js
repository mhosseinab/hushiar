var mongoose = require('mongoose');

var SensorSchema = new mongoose.Schema({
  registerDate : Date,
  manufactureId: String,
  type: String, //GPS,Camera,Detector,Microphone, Temperature
  staus: String,//active, silent, monitoring, online,
  device : {type: mongoose.Schema.Types.ObjectId, ref:'Device'},
  isActive: Boolean,
});

module.exports = mongoose.model('Sensor',SensorSchema);
