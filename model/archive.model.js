var mongoose = require('mongoose');

var ArchiveSchema = new mongoose.Schema({
  startDate : Date,
  endDate : Date,
  duration: Number,
  device : {type: mongoose.Schema.Types.ObjectId, ref:'Device'},
  sensor : {type: mongoose.Schema.Types.ObjectId, ref:'Sensor'},
  duration : Date,
  isMoving: Boolean,
  hasHighSound: Boolean,
  hasHighTemperture: Boolean,
  videoFileName: String,
  imageList: [{type: mongoose.Schema.Types.ObjectId, ref:'Image'}],
});

module.exports = mongoose.model('Archive',ArchiveSchema);
