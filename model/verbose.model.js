var mongoose = require('mongoose');

var VerboseSchema = new mongoose.Schema({
  registerDate : Date,
  data: {type: mongoose.Schema.Types.Mixed},
  device : {type: mongoose.Schema.Types.ObjectId, ref:'Device'},
});

module.exports = mongoose.model('Verbose',VerboseSchema);
