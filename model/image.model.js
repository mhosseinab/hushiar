var mongoose = require('mongoose');

var ImageSchema = new mongoose.Schema({
  registerDate : Date,
  device : {type: mongoose.Schema.Types.ObjectId, ref:'Device'},
  actuator : {type: mongoose.Schema.Types.ObjectId, ref:'Actuator'},
  file: {type: mongoose.Schema.Types.Mixed},
  fileName: String,
});

module.exports = mongoose.model('Image',ImageSchema);
