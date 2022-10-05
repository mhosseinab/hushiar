var mongoose = require('mongoose');

var LogSchema = new mongoose.Schema({
  registerDate : Date,
  type: String,//
  logData: {type: mongoose.Schema.Types.Mixed},
  device : {type: mongoose.Schema.Types.ObjectId, ref:'Device'},
  User : {type: mongoose.Schema.Types.ObjectId, ref:'User'},
});

module.exports = mongoose.model('Log',LogSchema);
