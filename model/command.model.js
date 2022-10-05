var mongoose = require('mongoose');

var CommandSchema = new mongoose.Schema({
  registerDate : Date,
  device : {type: mongoose.Schema.Types.ObjectId, ref:'Device'},
  actuator : {type: mongoose.Schema.Types.ObjectId, ref:'Actuator'},
  sensor : {type: mongoose.Schema.Types.ObjectId, ref:'Sensor'},
  command: String,
  logData: [{type: mongoose.Schema.Types.Mixed}],
  fetchDate: Date,
  isDone: Boolean,
});

module.exports = mongoose.model('Command',CommandSchema);
