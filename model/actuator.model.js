var mongoose = require('mongoose');

var ActuatorSchema = new mongoose.Schema({
  registerDate : Date,
  manufactureId: String,
  type: String, //Buzzer, Speaker, Light, Beacon, Capture,
  staus: String,//active, silent, monitoring, online,
  device : {type: mongoose.Schema.Types.ObjectId, ref:'Device'},
  isActive: Boolean,
});

module.exports = mongoose.model('Actuator',ActuatorSchema);


// isActive vs status
// isActive is for set actuatur is active or on
// status is for set the last status of actuator
// sample: Buzzer is active and status is "silent" now and when it statr to alarm status change to "onAlarm"
//          all of them means that Buzzer is active and working when its on montiroin mode
